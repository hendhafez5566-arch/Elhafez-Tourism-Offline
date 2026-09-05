package com.elhafez.tourism.erp.customer;

import android.Manifest;
import android.content.Context;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.database.Cursor;
import android.os.Environment;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.Color;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.pdf.PdfDocument;
import android.os.Bundle;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.print.pdf.PrintedPdfDocument;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Base64;

import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final int PICK_PHONE_REQUEST = 4317;
    private static final int BACKUP_STORAGE_PERMISSION_REQUEST = 4318;
    private String pendingContactField = "";
    private final Map<String, BackupTransfer> backupTransfers = new HashMap<>();
    private String pendingBackupDownloadId = "";
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
        }
        // These native interfaces live on the WebView itself, so they remain
        // available after the Customer resolver navigates to its Railway runtime.
        webView.addJavascriptInterface(new NativePrintBridge(), "NativePrint");
        webView.addJavascriptInterface(new NativeBackupBridge(), "NativeBackup");
        webView.addJavascriptInterface(new NativeShellBridge(), "NativeShell");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchNativeEvent("erp:native-back", "{}");
            }
        });
    }

    @Override
    public void onPause() {
        dispatchNativeEvent("erp:native-state", "{isActive:false}");
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        dispatchNativeEvent("erp:native-state", "{isActive:true}");
    }

    private void dispatchNativeEvent(String name, String detailJson) {
        try {
            WebView webView = getBridge() == null ? null : getBridge().getWebView();
            if (webView == null) return;
            String script = "window.dispatchEvent(new CustomEvent('" + name + "',{detail:" + detailJson + "}));";
            webView.post(() -> webView.evaluateJavascript(script, null));
        } catch (Exception ignored) { }
    }

    private boolean isAllowedRuntimeUrl(String raw) {
        try {
            Uri uri = Uri.parse(raw == null ? "" : raw.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();
            return "https".equalsIgnoreCase(scheme)
                    && host != null
                    && host.toLowerCase().endsWith(".up.railway.app");
        } catch (Exception ignored) {
            return false;
        }
    }

    private class NativeShellBridge {
        @JavascriptInterface
        public String getOwnerBaseUrl() {
            return "";
        }

        @JavascriptInterface
        public boolean isNative() { return true; }

        @JavascriptInterface
        public String platform() { return "android"; }

        @JavascriptInterface
        public void openRuntime(String url) {
            // Offline copy is intentionally self-contained and never navigates to Railway.
        }

        @JavascriptInterface
        public void pickContactPhone(String fieldName) {
            runOnUiThread(() -> {
                try {
                    pendingContactField = fieldName == null ? "" : fieldName.trim();
                    Intent pick = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
                    startActivityForResult(pick, PICK_PHONE_REQUEST);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public void reload() {
            runOnUiThread(() -> getBridge().getWebView().reload());
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::finishAndRemoveTask);
        }
    }

    private static class BackupTransfer {
        final String id;
        final File file;
        final String displayName;
        final String mimeType;
        final String mode;
        FileOutputStream output;

        BackupTransfer(String id, File file, String displayName, String mimeType, String mode, FileOutputStream output) {
            this.id = id;
            this.file = file;
            this.displayName = displayName;
            this.mimeType = mimeType;
            this.mode = mode;
            this.output = output;
        }
    }

    private String safeBackupName(String raw) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) name = "ERP_BACKUP.erpbackup";
        name = name.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        if (name.length() > 160) name = name.substring(name.length() - 160);
        return name;
    }

    private void notifyBackupDelivery(String id, String status, String action, String name, String message) {
        try {
            JSONObject detail = new JSONObject();
            detail.put("id", id == null ? "" : id);
            detail.put("status", status == null ? "error" : status);
            detail.put("action", action == null ? "" : action);
            detail.put("name", name == null ? "" : name);
            detail.put("message", message == null ? "" : message);
            dispatchNativeEvent("erp:native-backup-delivery", detail.toString());
        } catch (Exception ignored) { }
    }

    private void cleanupOldBackupCache(File dir) {
        try {
            File[] files = dir.listFiles();
            if (files == null) return;
            long cutoff = System.currentTimeMillis() - (24L * 60L * 60L * 1000L);
            for (File f : files) {
                if (f != null && f.isFile() && f.lastModified() < cutoff) {
                    try { f.delete(); } catch (Exception ignored) { }
                }
            }
        } catch (Exception ignored) { }
    }

    private class NativeBackupBridge {
        @JavascriptInterface
        public String beginBackupTransfer(String fileName, String mimeType, String mode) {
            String normalizedMode = "share".equalsIgnoreCase(mode) ? "share" : "download";
            String safeName = safeBackupName(fileName);
            String safeMime = (mimeType == null || mimeType.trim().isEmpty()) ? "application/octet-stream" : mimeType.trim();
            synchronized (backupTransfers) {
                try {
                    File dir = new File(getCacheDir(), "erp-backups");
                    if (!dir.exists() && !dir.mkdirs()) return "";
                    cleanupOldBackupCache(dir);
                    String id = UUID.randomUUID().toString();
                    File file = new File(dir, id + "_" + safeName);
                    FileOutputStream out = new FileOutputStream(file, false);
                    backupTransfers.put(id, new BackupTransfer(id, file, safeName, safeMime, normalizedMode, out));
                    return id;
                } catch (Exception ignored) {
                    return "";
                }
            }
        }

        @JavascriptInterface
        public boolean appendBackupChunk(String id, String base64Chunk) {
            synchronized (backupTransfers) {
                BackupTransfer transfer = backupTransfers.get(id);
                if (transfer == null || transfer.output == null) return false;
                try {
                    byte[] bytes = Base64.decode(base64Chunk == null ? "" : base64Chunk, Base64.NO_WRAP);
                    transfer.output.write(bytes);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
        }

        @JavascriptInterface
        public boolean finishBackupTransfer(String id) {
            final BackupTransfer transfer;
            synchronized (backupTransfers) {
                transfer = backupTransfers.get(id);
                if (transfer == null) return false;
                try {
                    if (transfer.output != null) {
                        transfer.output.flush();
                        transfer.output.close();
                        transfer.output = null;
                    }
                } catch (Exception e) {
                    cancelBackupTransfer(id);
                    return false;
                }
            }
            if (!transfer.file.isFile() || transfer.file.length() <= 0) {
                cancelBackupTransfer(id);
                return false;
            }
            if ("share".equals(transfer.mode)) {
                runOnUiThread(() -> shareBackupTransfer(transfer));
                return true;
            }
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                    && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                pendingBackupDownloadId = id;
                runOnUiThread(() -> ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                        BACKUP_STORAGE_PERMISSION_REQUEST));
                return true;
            }
            saveBackupTransferToDownloads(transfer);
            return true;
        }

        @JavascriptInterface
        public void cancelBackupTransfer(String id) {
            MainActivity.this.cancelBackupTransfer(id);
        }
    }

    private void cancelBackupTransfer(String id) {
        BackupTransfer transfer;
        synchronized (backupTransfers) {
            transfer = backupTransfers.remove(id);
        }
        if (transfer == null) return;
        try { if (transfer.output != null) transfer.output.close(); } catch (Exception ignored) { }
        try { if (transfer.file.exists()) transfer.file.delete(); } catch (Exception ignored) { }
    }

    private void copyFile(File source, OutputStream destination) throws Exception {
        byte[] buffer = new byte[64 * 1024];
        try (FileInputStream in = new FileInputStream(source)) {
            int read;
            while ((read = in.read(buffer)) != -1) destination.write(buffer, 0, read);
            destination.flush();
        }
    }

    private void saveBackupTransferToDownloads(BackupTransfer transfer) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, transfer.displayName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, transfer.mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Elhafez Tourism");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("download_insert_failed");
                try (OutputStream out = getContentResolver().openOutputStream(uri, "w")) {
                    if (out == null) throw new IllegalStateException("download_stream_failed");
                    copyFile(transfer.file, out);
                } catch (Exception e) {
                    try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) { }
                    throw e;
                }
                ContentValues complete = new ContentValues();
                complete.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContentResolver().update(uri, complete, null, null);
            } else {
                File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File dir = new File(downloads, "Elhafez Tourism");
                if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("download_dir_failed");
                File target = new File(dir, transfer.displayName);
                try (OutputStream out = new FileOutputStream(target, false)) {
                    copyFile(transfer.file, out);
                }
            }
            synchronized (backupTransfers) { backupTransfers.remove(transfer.id); }
            try { transfer.file.delete(); } catch (Exception ignored) { }
            notifyBackupDelivery(transfer.id, "success", "download", transfer.displayName,
                    "تم حفظ النسخة في Downloads / Elhafez Tourism");
        } catch (Exception e) {
            synchronized (backupTransfers) { backupTransfers.remove(transfer.id); }
            try { transfer.file.delete(); } catch (Exception ignored) { }
            notifyBackupDelivery(transfer.id, "error", "download", transfer.displayName,
                    "تعذر حفظ النسخة على الجهاز");
        }
    }

    private void shareBackupTransfer(BackupTransfer transfer) {
        try {
            Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", transfer.file);
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("application/octet-stream");
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.putExtra(Intent.EXTRA_SUBJECT, "نسخة احتياطية - Elhafez Tourism");
            share.setClipData(ClipData.newRawUri(transfer.displayName, uri));
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(share, "مشاركة النسخة الاحتياطية");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(chooser);
            synchronized (backupTransfers) { backupTransfers.remove(transfer.id); }
            notifyBackupDelivery(transfer.id, "success", "share", transfer.displayName,
                    "تم إنشاء النسخة وفتح قائمة المشاركة");
        } catch (ActivityNotFoundException e) {
            synchronized (backupTransfers) { backupTransfers.remove(transfer.id); }
            notifyBackupDelivery(transfer.id, "error", "share", transfer.displayName,
                    "لا يوجد تطبيق متاح لمشاركة النسخة");
        } catch (Exception e) {
            synchronized (backupTransfers) { backupTransfers.remove(transfer.id); }
            notifyBackupDelivery(transfer.id, "error", "share", transfer.displayName,
                    "تعذر فتح قائمة مشاركة النسخة");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != BACKUP_STORAGE_PERMISSION_REQUEST) return;
        String id = pendingBackupDownloadId;
        pendingBackupDownloadId = "";
        BackupTransfer transfer;
        synchronized (backupTransfers) { transfer = backupTransfers.get(id); }
        if (transfer == null) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            saveBackupTransferToDownloads(transfer);
        } else {
            cancelBackupTransfer(id);
            notifyBackupDelivery(id, "error", "download", transfer.displayName,
                    "لم يتم منح إذن حفظ النسخة على الجهاز");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_PHONE_REQUEST || resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        String phone = "", name = "";
        try (Cursor cursor = getContentResolver().query(uri,
                new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME},
                null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int phoneIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                if (phoneIndex >= 0) phone = cursor.getString(phoneIndex);
                if (nameIndex >= 0) name = cursor.getString(nameIndex);
            }
        } catch (Exception ignored) { }
        try {
            JSONObject detail = new JSONObject();
            detail.put("field", pendingContactField == null ? "" : pendingContactField);
            detail.put("phone", phone == null ? "" : phone);
            detail.put("name", name == null ? "" : name);
            dispatchNativeEvent("erp:native-contact-picked", detail.toString());
        } catch (Exception ignored) { }
        pendingContactField = "";
    }

    private void startPrint(WebView webView, String jobName) {
        PrintManager manager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(
                (jobName == null || jobName.trim().isEmpty()) ? "Elhafez ERP" : jobName.trim());
        manager.print("Elhafez ERP", adapter, new PrintAttributes.Builder().build());
    }

    private void notifyPdfShare(String status, String message) {
        try {
            JSONObject detail = new JSONObject();
            detail.put("status", status == null ? "error" : status);
            detail.put("message", message == null ? "" : message);
            dispatchNativeEvent("erp:native-pdf-share", detail.toString());
        } catch (Exception ignored) { }
    }

    private void destroyPrintView(WebView view) {
        try {
            if (view != null && view.getParent() instanceof ViewGroup) {
                ((ViewGroup) view.getParent()).removeView(view);
            }
        } catch (Exception ignored) { }
        try { if (view != null) view.destroy(); } catch (Exception ignored) { }
    }

    private void attachPrintView(WebView view) { attachPrintView(view, 794); }

    private void attachPrintView(WebView view, int initialWidth) {
        try {
            ViewGroup root = findViewById(android.R.id.content);
            if (root == null || view.getParent() != null) return;
            // Keep the print WebView attached and visible behind the app so Chromium paints it.
            view.setBackgroundColor(Color.WHITE);
            view.setClickable(false);
            view.setFocusable(false);
            int initialHeight = Math.max(1200, root.getHeight() > 0 ? root.getHeight() : 1200);
            root.addView(view, 0, new ViewGroup.LayoutParams(Math.max(320, initialWidth), initialHeight));
        } catch (Exception ignored) { }
    }

    private void afterVisualReady(WebView view, Runnable task) {
        try {
            view.postVisualStateCallback(System.nanoTime(), new WebView.VisualStateCallback() {
                @Override public void onComplete(long requestId) {
                    view.postDelayed(() -> {
                        try {
                            view.requestLayout();
                            view.invalidate();
                            task.run();
                        } catch (Exception e) {
                            notifyPdfShare("error", "تعذر تجهيز محتوى المستند للمشاركة");
                            destroyPrintView(view);
                        }
                    }, 80);
                }
            });
        } catch (Exception e) {
            view.postDelayed(task, 180);
        }
    }

    private Intent buildPdfShareIntent(Uri uri) {
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("application/pdf");
        share.putExtra(Intent.EXTRA_STREAM, uri);
        share.setClipData(ClipData.newRawUri("Elhafez PDF", uri));
        share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return share;
    }

    private void sharePdfFile(File file) {
        try {
            if (file == null || !file.isFile() || file.length() <= 0) {
                notifyPdfShare("error", "ملف PDF غير صالح للمشاركة");
                return;
            }
            Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
            Intent chooser = Intent.createChooser(buildPdfShareIntent(uri), "مشاركة ملف PDF");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(chooser);
            notifyPdfShare("success", "تم إنشاء ملف PDF وفتح قائمة المشاركة");
        } catch (ActivityNotFoundException e) {
            notifyPdfShare("error", "لا يوجد تطبيق متاح لمشاركة ملف PDF");
        } catch (Exception e) {
            notifyPdfShare("error", "تعذر فتح مشاركة ملف PDF");
        }
    }

    private PrintAttributes buildPdfAttributes(boolean landscape) {
        PrintAttributes.MediaSize media = PrintAttributes.MediaSize.ISO_A4;
        media = landscape ? media.asLandscape() : media.asPortrait();
        return new PrintAttributes.Builder()
                .setMediaSize(media)
                .setResolution(new PrintAttributes.Resolution("elhafez_pdf", "Elhafez PDF", 600, 600))
                .setMinMargins(new PrintAttributes.Margins(394, 394, 394, 394))
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .build();
    }

    /**
     * Creates a generic Android share attachment with the public PDF canvas API.
     * The WebView is drawn directly onto PDF pages: there is no intermediate
     * Bitmap/screenshot and no direct construction of framework-only
     * PrintDocumentAdapter callbacks.
     */
    private void createAndSharePdf(WebView view, String jobName, String orientation) {
        final String safe = (jobName == null || jobName.trim().isEmpty())
                ? "document"
                : jobName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        final File file = new File(getCacheDir(), safe + "_" + System.currentTimeMillis() + ".pdf");
        final boolean landscape = "landscape".equalsIgnoreCase(orientation);
        final int cssContentWidth = landscape ? 1047 : 718;
        final float density = Math.max(1f, getResources().getDisplayMetrics().density);
        final int renderWidth = Math.max(cssContentWidth, Math.round(cssContentWidth * density));
        final PrintAttributes attributes = buildPdfAttributes(landscape);
        PrintedPdfDocument document = null;

        try {
            // Lay the hidden print WebView out at a stable print width and its
            // full document height before recording it into the PDF canvas.
            ViewGroup.LayoutParams layoutParams = view.getLayoutParams();
            if (layoutParams != null) {
                layoutParams.width = renderWidth;
                view.setLayoutParams(layoutParams);
            }
            int widthSpec = View.MeasureSpec.makeMeasureSpec(renderWidth, View.MeasureSpec.EXACTLY);
            int measuredHeightSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            view.measure(widthSpec, measuredHeightSpec);
            int measuredHeight = Math.max(1, view.getMeasuredHeight());
            int chromiumHeight = Math.max(1, Math.round(view.getContentHeight() * density));
            int contentHeight = Math.max(measuredHeight, chromiumHeight);
            if (contentHeight <= 2) throw new IllegalStateException("pdf_content_not_ready");
            view.measure(widthSpec, View.MeasureSpec.makeMeasureSpec(contentHeight, View.MeasureSpec.EXACTLY));
            view.layout(0, 0, renderWidth, contentHeight);
            view.scrollTo(0, 0);

            document = new PrintedPdfDocument(MainActivity.this, attributes);
            Rect contentRect = document.getPageContentRect();
            if (contentRect.width() <= 0 || contentRect.height() <= 0) {
                throw new IllegalStateException("pdf_page_invalid");
            }

            final float scale = contentRect.width() / (float) renderWidth;
            final float sourcePageHeight = contentRect.height() / scale;
            final int pageCount = Math.max(1, (int) Math.ceil(contentHeight / sourcePageHeight));

            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                PdfDocument.Page page = document.startPage(pageIndex);
                Canvas canvas = page.getCanvas();
                canvas.drawColor(Color.WHITE);
                int save = canvas.save();
                canvas.clipRect(contentRect);
                canvas.translate(contentRect.left, contentRect.top);
                canvas.scale(scale, scale);
                canvas.translate(0f, -(pageIndex * sourcePageHeight));
                view.draw(canvas);
                canvas.restoreToCount(save);
                document.finishPage(page);
            }

            try (FileOutputStream out = new FileOutputStream(file)) {
                document.writeTo(out);
                out.flush();
            }
            document.close();
            document = null;
            destroyPrintView(view);

            if (!file.isFile() || file.length() < 512) {
                try { file.delete(); } catch (Exception ignored) { }
                notifyPdfShare("error", "تم إنشاء ملف PDF غير صالح");
                return;
            }
            sharePdfFile(file);
        } catch (Exception e) {
            try { if (document != null) document.close(); } catch (Exception ignored) { }
            try { file.delete(); } catch (Exception ignored) { }
            destroyPrintView(view);
            notifyPdfShare("error", "تعذر إنشاء ملف PDF للمشاركة");
        }
    }

    private class NativePrintBridge {
        @JavascriptInterface
        public void printCurrent(String jobName) {
            runOnUiThread(() -> startPrint(getBridge().getWebView(), jobName));
        }

        @JavascriptInterface
        public void printHtml(String html, String jobName) {
            runOnUiThread(() -> {
                final WebView printView = new WebView(MainActivity.this);
                attachPrintView(printView);
                printView.getSettings().setJavaScriptEnabled(false);
                printView.getSettings().setDomStorageEnabled(false);
                printView.getSettings().setLoadsImagesAutomatically(true);
                printView.setWebViewClient(new WebViewClient() {
                    private boolean printed = false;
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (printed) return;
                        printed = true;
                        afterVisualReady(view, () -> startPrint(view, jobName));
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }

        @JavascriptInterface
        public void shareDocumentPdf(String html, String jobName, String orientation) {
            runOnUiThread(() -> {
                final boolean landscape = "landscape".equalsIgnoreCase(orientation);
                final int cssWidth = landscape ? 1047 : 718;
                final WebView printView = new WebView(MainActivity.this);
                attachPrintView(printView, cssWidth);
                printView.getSettings().setJavaScriptEnabled(false);
                printView.getSettings().setDomStorageEnabled(false);
                printView.getSettings().setLoadsImagesAutomatically(true);
                printView.getSettings().setUseWideViewPort(true);
                printView.getSettings().setLoadWithOverviewMode(false);
                printView.setWebViewClient(new WebViewClient() {
                    private boolean shared = false;
                    @Override public void onPageFinished(WebView view, String url) {
                        if (shared) return;
                        shared = true;
                        afterVisualReady(view, () -> createAndSharePdf(view, jobName, landscape ? "landscape" : "portrait"));
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }
    }
}
