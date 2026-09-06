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
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PageRange;
import android.print.PrintManager;
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
    private static final String AUTH_PREFS = "elhafez_offline_auth";
    private static final String AUTH_USER_KEY = "persistent_user_id";
    private String pendingContactField = "";
    private final Map<String, BackupTransfer> backupTransfers = new HashMap<>();
    private String pendingBackupDownloadId = "";
    private String lastCanonicalPdfKey = "";
    private File lastCanonicalPdfFile = null;
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
        public String getPersistentSessionUserId() {
            try {
                return getSharedPreferences(AUTH_PREFS, MODE_PRIVATE).getString(AUTH_USER_KEY, "");
            } catch (Exception ignored) {
                return "";
            }
        }

        @JavascriptInterface
        public void setPersistentSessionUserId(String userId) {
            String clean = userId == null ? "" : userId.trim();
            if (clean.isEmpty() || clean.length() > 160 || !clean.matches("[A-Za-z0-9._:-]+")) return;
            try {
                getSharedPreferences(AUTH_PREFS, MODE_PRIVATE).edit().putString(AUTH_USER_KEY, clean).commit();
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void clearPersistentSession() {
            try {
                getSharedPreferences(AUTH_PREFS, MODE_PRIVATE).edit().remove(AUTH_USER_KEY).commit();
            } catch (Exception ignored) { }
        }

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
        public void openWhatsAppChat(String phone, String text) {
            runOnUiThread(() -> {
                String normalized = phone == null ? "" : phone.replaceAll("\\D", "");
                if (normalized.isEmpty()) return;
                String suffix = (text == null || text.trim().isEmpty()) ? "" : "?text=" + Uri.encode(text.trim());
                Uri uri = Uri.parse("https://wa.me/" + normalized + suffix);
                String[] packages = new String[]{"com.whatsapp", "com.whatsapp.w4b"};
                for (String pkg : packages) {
                    try {
                        Intent direct = new Intent(Intent.ACTION_VIEW, uri);
                        direct.setPackage(pkg);
                        startActivity(direct);
                        return;
                    } catch (Exception ignored) { }
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
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
        if (name.isEmpty()) name = "نسخة احتياطية - Elhafez Tourism.erpbackup";
        name = name.replaceAll("[\\/:*?\"<>|]+", " ").replaceAll("\\s+", " ").trim();
        if (name.length() > 160) name = name.substring(0, 160);
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
        startPrint(webView, jobName, "portrait");
    }

    private void startPrint(WebView webView, String jobName, String orientation) {
        PrintManager manager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        String safeJob = (jobName == null || jobName.trim().isEmpty()) ? "Elhafez ERP" : jobName.trim();
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(safeJob);
        boolean landscape = "landscape".equalsIgnoreCase(orientation);
        manager.print(safeJob, adapter, buildPdfAttributes(landscape));
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

    private Intent buildWhatsAppPdfIntent(Uri uri, String phone, String packageName) {
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("application/pdf");
        share.putExtra(Intent.EXTRA_STREAM, uri);
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]+", "");
        if (!digits.isEmpty()) share.putExtra("jid", digits + "@s.whatsapp.net");
        share.setClipData(ClipData.newRawUri("Elhafez PDF", uri));
        share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        share.setPackage(packageName);
        grantUriPermission(packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return share;
    }

    private void sharePdfFileToWhatsApp(File file, String phone) {
        try {
            if (file == null || !file.isFile() || file.length() <= 0) {
                notifyPdfShare("error", "ملف PDF غير صالح للإرسال");
                return;
            }
            String digits = phone == null ? "" : phone.replaceAll("[^0-9]+", "");
            if (digits.isEmpty()) {
                notifyPdfShare("error", "لا يوجد رقم واتساب صالح لهذا المستند");
                return;
            }
            Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
            try {
                startActivity(buildWhatsAppPdfIntent(uri, digits, "com.whatsapp"));
                notifyPdfShare("success", "تم تجهيز نفس ملف PDF المطبوع وفتح واتساب");
                return;
            } catch (ActivityNotFoundException ignored) { }
            try {
                startActivity(buildWhatsAppPdfIntent(uri, digits, "com.whatsapp.w4b"));
                notifyPdfShare("success", "تم تجهيز نفس ملف PDF المطبوع وفتح واتساب Business");
                return;
            } catch (ActivityNotFoundException ignored) { }
            notifyPdfShare("error", "واتساب غير مثبت على الجهاز");
        } catch (Exception e) {
            notifyPdfShare("error", "تعذر فتح واتساب لإرسال ملف PDF");
        }
    }

    private PrintAttributes buildPdfAttributes(boolean landscape) {
        PrintAttributes.MediaSize media = PrintAttributes.MediaSize.ISO_A4;
        media = landscape ? media.asLandscape() : media.asPortrait();
        return new PrintAttributes.Builder()
                .setMediaSize(media)
                .setResolution(new PrintAttributes.Resolution("elhafez_pdf", "Elhafez PDF", 600, 600))
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .build();
    }


    private String safePdfName(String jobName) {
        String safe = (jobName == null || jobName.trim().isEmpty()) ? "مستند.pdf" : jobName.trim();
        if (!safe.toLowerCase().endsWith(".pdf")) safe += ".pdf";
        return safe.replaceAll("[\\/:*?\"<>|]+", "-").replaceAll("\\s+", " ").trim();
    }

    /**
     * Canonical PDF engine for every printed/shared document.
     * Chromium/WebView's PrintDocumentAdapter creates the PDF stream directly,
     * preserving selectable text, CSS pagination, RTL and A4 dimensions.
     * No Canvas, Bitmap, screenshot or secondary renderer is involved.
     */
    private void createCanonicalPdfFromHtml(WebView view,
                                            String jobName,
                                            String orientation,
                                            File file,
                                            android.print.PdfPrint.Result result) {
        final String safeName = safePdfName(jobName);
        try { if (file.exists()) file.delete(); } catch (Exception ignored) { }
        boolean landscape = "landscape".equalsIgnoreCase(orientation);
        PrintAttributes attributes = buildPdfAttributes(landscape);
        PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(safeName);
        android.print.PdfPrint.write(MainActivity.this, adapter, attributes, file,
                new android.print.PdfPrint.Result() {
                    @Override public void onSuccess(File pdf) {
                        runOnUiThread(() -> {
                            destroyPrintView(view);
                            result.onSuccess(pdf);
                        });
                    }

                    @Override public void onError(String message) {
                        runOnUiThread(() -> {
                            try { file.delete(); } catch (Exception ignored) { }
                            destroyPrintView(view);
                            result.onError(message);
                        });
                    }
                });
    }

    private String canonicalPdfKey(String html, String jobName, String orientation) {
        String raw = (html == null ? "" : html) + "\n#" + safePdfName(jobName) + "#" +
                ("landscape".equalsIgnoreCase(orientation) ? "landscape" : "portrait");
        return Integer.toHexString(raw.hashCode()) + "-" + Integer.toHexString(raw.length());
    }

    private void getOrCreateCanonicalPdf(String html,
                                         String jobName,
                                         String orientation,
                                         android.print.PdfPrint.Result result) {
        final String key = canonicalPdfKey(html, jobName, orientation);
        if (key.equals(lastCanonicalPdfKey) && lastCanonicalPdfFile != null
                && lastCanonicalPdfFile.isFile() && lastCanonicalPdfFile.length() > 0) {
            result.onSuccess(lastCanonicalPdfFile);
            return;
        }
        final File dir = new File(getCacheDir(), "canonical_pdf/" + key);
        final File output = new File(dir, safePdfName(jobName));
        loadCanonicalPrintView(html, orientation, view ->
                createCanonicalPdfFromHtml(view, jobName, orientation, output,
                        new android.print.PdfPrint.Result() {
                            @Override public void onSuccess(File file) {
                                lastCanonicalPdfKey = key;
                                lastCanonicalPdfFile = file;
                                result.onSuccess(file);
                            }

                            @Override public void onError(String message) {
                                result.onError(message);
                            }
                        }));
    }

    private interface CanonicalPrintReady { void run(WebView view); }

    private WebView loadCanonicalPrintView(String html, String orientation, CanonicalPrintReady afterLoaded) {
        final String resolvedOrientation = "landscape".equalsIgnoreCase(orientation) ? "landscape" : "portrait";
        final int cssWidth = "landscape".equals(resolvedOrientation) ? 1047 : 718;
        final WebView printView = new WebView(MainActivity.this);
        attachPrintView(printView, cssWidth);
        printView.getSettings().setJavaScriptEnabled(false);
        printView.getSettings().setDomStorageEnabled(false);
        printView.getSettings().setLoadsImagesAutomatically(true);
        printView.getSettings().setUseWideViewPort(true);
        printView.getSettings().setLoadWithOverviewMode(false);
        printView.setWebViewClient(new WebViewClient() {
            private boolean ready = false;
            @Override public void onPageFinished(WebView view, String url) {
                if (ready) return;
                ready = true;
                afterVisualReady(view, () -> afterLoaded.run(view));
            }
        });
        printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
        return printView;
    }

    private static class PdfFilePrintAdapter extends PrintDocumentAdapter {
        private final File file;
        private final String documentName;

        PdfFilePrintAdapter(File file, String documentName) {
            this.file = file;
            this.documentName = documentName;
        }

        @Override
        public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras) {
            if (cancellationSignal != null && cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }
            PrintDocumentInfo info = new PrintDocumentInfo.Builder(documentName)
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                    .build();
            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellationSignal, WriteResultCallback callback) {
            try (FileInputStream in = new FileInputStream(file); FileOutputStream out = new FileOutputStream(destination.getFileDescriptor())) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    if (cancellationSignal != null && cancellationSignal.isCanceled()) {
                        callback.onWriteCancelled();
                        return;
                    }
                    out.write(buffer, 0, read);
                }
                out.flush();
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
            } catch (Exception e) {
                callback.onWriteFailed("تعذر تجهيز ملف PDF للطباعة");
            }
        }
    }

    private void printPdfFile(File file, String jobName, String orientation) {
        if (file == null || !file.isFile() || file.length() <= 0) {
            notifyPdfShare("error", "ملف PDF غير صالح للطباعة");
            return;
        }
        String safeJob = safePdfName(jobName);
        boolean landscape = "landscape".equalsIgnoreCase(orientation);
        PrintManager manager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        manager.print(safeJob, new PdfFilePrintAdapter(file, safeJob), buildPdfAttributes(landscape));
    }

    private class NativePrintBridge {
        @JavascriptInterface
        public void printCurrent(String jobName) {
            runOnUiThread(() -> startPrint(getBridge().getWebView(), jobName));
        }

        @JavascriptInterface
        public void printHtml(String html, String jobName) {
            printHtmlA4(html, jobName, "portrait");
        }

        @JavascriptInterface
        public void printHtmlA4(String html, String jobName, String orientation) {
            runOnUiThread(() -> getOrCreateCanonicalPdf(html, jobName, orientation,
                    new android.print.PdfPrint.Result() {
                        @Override public void onSuccess(File file) {
                            printPdfFile(file, jobName, orientation);
                        }

                        @Override public void onError(String message) {
                            notifyPdfShare("error", "تعذر إنشاء ملف PDF للطباعة");
                        }
                    }));
        }

        @JavascriptInterface
        public void shareHtmlA4ToWhatsApp(String html, String jobName, String orientation, String phone) {
            runOnUiThread(() -> getOrCreateCanonicalPdf(html, jobName, orientation,
                    new android.print.PdfPrint.Result() {
                        @Override public void onSuccess(File file) {
                            sharePdfFileToWhatsApp(file, phone);
                        }

                        @Override public void onError(String message) {
                            notifyPdfShare("error", "تعذر إنشاء ملف PDF لواتساب");
                        }
                    }));
        }
    }
}
