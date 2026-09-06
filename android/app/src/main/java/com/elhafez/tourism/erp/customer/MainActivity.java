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
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextDirectionHeuristics;
import android.text.TextUtils;
import android.graphics.pdf.PdfDocument;
import android.os.Bundle;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
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
import org.json.JSONArray;

public class MainActivity extends BridgeActivity {
    private static final int PICK_PHONE_REQUEST = 4317;
    private static final int BACKUP_STORAGE_PERMISSION_REQUEST = 4318;
    private static final String AUTH_PREFS = "elhafez_offline_auth";
    private static final String AUTH_USER_KEY = "persistent_user_id";
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
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .build();
    }

    private static class StructuredPdfState {
        final PdfDocument document;
        final JSONObject model;
        final int pageWidth;
        final int pageHeight;
        final float margin = 28.35f;
        PdfDocument.Page page;
        Canvas canvas;
        int pageNumber = 0;
        float y = 0f;
        Bitmap logo;

        StructuredPdfState(PdfDocument document, JSONObject model, int pageWidth, int pageHeight) {
            this.document = document;
            this.model = model;
            this.pageWidth = pageWidth;
            this.pageHeight = pageHeight;
        }
    }

    private TextPaint pdfTextPaint(float size, boolean bold, int color) {
        TextPaint paint = new TextPaint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setColor(color);
        paint.setTextSize(size);
        paint.setTypeface(Typeface.create("sans-serif", bold ? Typeface.BOLD : Typeface.NORMAL));
        return paint;
    }

    private StaticLayout pdfTextLayout(String raw, float width, float size, boolean bold, int color, int maxLines) {
        String text = raw == null ? "" : raw.trim();
        TextPaint paint = pdfTextPaint(size, bold, color);
        StaticLayout.Builder builder = StaticLayout.Builder.obtain(text, 0, text.length(), paint, Math.max(1, Math.round(width)))
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setTextDirection(TextDirectionHeuristics.RTL)
                .setIncludePad(false)
                .setLineSpacing(0f, 1.05f);
        if (maxLines > 0) {
            builder.setMaxLines(maxLines);
            builder.setEllipsize(TextUtils.TruncateAt.END);
            builder.setEllipsizedWidth(Math.max(1, Math.round(width)));
        }
        return builder.build();
    }

    private float drawPdfText(Canvas canvas, String text, float x, float y, float width,
                              float size, boolean bold, int color, int maxLines) {
        StaticLayout layout = pdfTextLayout(text, width, size, bold, color, maxLines);
        int save = canvas.save();
        canvas.translate(x, y);
        layout.draw(canvas);
        canvas.restoreToCount(save);
        return layout.getHeight();
    }

    private Bitmap decodePdfLogo(String raw) {
        try {
            if (raw == null || !raw.startsWith("data:image/")) return null;
            int comma = raw.indexOf(',');
            if (comma < 0) return null;
            byte[] bytes = Base64.decode(raw.substring(comma + 1), Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void finishStructuredPage(StructuredPdfState st) {
        if (st.page != null) {
            st.document.finishPage(st.page);
            st.page = null;
            st.canvas = null;
        }
    }

    private void beginStructuredPage(StructuredPdfState st, boolean continuation) {
        finishStructuredPage(st);
        st.pageNumber++;
        PdfDocument.PageInfo info = new PdfDocument.PageInfo.Builder(st.pageWidth, st.pageHeight, st.pageNumber).create();
        st.page = st.document.startPage(info);
        st.canvas = st.page.getCanvas();
        st.canvas.drawColor(Color.WHITE);

        final int NAVY = Color.rgb(17, 39, 69);
        final int GOLD = Color.rgb(201, 151, 47);
        final int MUTED = Color.rgb(96, 111, 132);
        Paint rule = new Paint(Paint.ANTI_ALIAS_FLAG);
        rule.setColor(NAVY);
        st.canvas.drawRect(st.margin, 20f, st.pageWidth - st.margin - 115f, 25f, rule);
        rule.setColor(GOLD);
        st.canvas.drawRect(st.pageWidth - st.margin - 115f, 20f, st.pageWidth - st.margin, 25f, rule);

        JSONObject company = st.model.optJSONObject("company");
        String companyName = company == null ? "الشركة" : company.optString("name", "الشركة");
        String title = st.model.optString("title", "مستند");
        if (continuation) title += " — تابع";
        float logoW = 0f;
        if (st.logo != null) {
            float box = 40f;
            float ratio = Math.min(box / Math.max(1f, st.logo.getWidth()), box / Math.max(1f, st.logo.getHeight()));
            float w = st.logo.getWidth() * ratio, h = st.logo.getHeight() * ratio;
            st.canvas.drawBitmap(st.logo, null,
                    new android.graphics.RectF(st.pageWidth - st.margin - w, 34f, st.pageWidth - st.margin, 34f + h), null);
            logoW = w + 8f;
        }
        drawPdfText(st.canvas, companyName, st.margin + (st.pageWidth - 2 * st.margin) * .52f, 35f,
                (st.pageWidth - 2 * st.margin) * .48f - logoW, 13f, true, NAVY, 2);
        if (company != null) {
            JSONArray lines = company.optJSONArray("lines");
            if (lines != null && lines.length() > 0) {
                StringBuilder small = new StringBuilder();
                for (int i = 0; i < Math.min(3, lines.length()); i++) {
                    if (i > 0) small.append(" • ");
                    small.append(lines.optString(i));
                }
                drawPdfText(st.canvas, small.toString(), st.margin + (st.pageWidth - 2 * st.margin) * .52f, 54f,
                        (st.pageWidth - 2 * st.margin) * .48f - logoW, 7.6f, false, MUTED, 2);
            }
        }
        drawPdfText(st.canvas, title, st.margin, 35f, (st.pageWidth - 2 * st.margin) * .44f,
                14f, true, NAVY, 2);
        String issue = st.model.optString("issue", "");
        if (!issue.isEmpty()) drawPdfText(st.canvas, issue, st.margin, 58f,
                (st.pageWidth - 2 * st.margin) * .44f, 7.5f, false, MUTED, 1);
        st.y = 88f;
    }

    private void ensureStructuredSpace(StructuredPdfState st, float need) {
        if (st.y + need > st.pageHeight - 42f) beginStructuredPage(st, true);
    }

    private void drawStructuredMeta(StructuredPdfState st, JSONArray items) {
        if (items == null || items.length() == 0) return;
        final int LINE = Color.rgb(217, 225, 235), SOFT = Color.rgb(245, 248, 252), INK = Color.rgb(40, 55, 76);
        float gap = 7f, colW = (st.pageWidth - 2 * st.margin - gap) / 2f;
        int rows = (items.length() + 1) / 2;
        ensureStructuredSpace(st, rows * 31f + 8f);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); fill.setColor(SOFT);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(.7f); stroke.setColor(LINE);
        for (int i = 0; i < items.length(); i++) {
            int row = i / 2, col = i % 2;
            float x = st.pageWidth - st.margin - colW - col * (colW + gap), y = st.y + row * 31f;
            st.canvas.drawRoundRect(x, y, x + colW, y + 25f, 5f, 5f, fill);
            st.canvas.drawRoundRect(x, y, x + colW, y + 25f, 5f, 5f, stroke);
            drawPdfText(st.canvas, items.optString(i), x + 6f, y + 6f, colW - 12f, 8.2f, true, INK, 2);
        }
        st.y += rows * 31f + 3f;
    }

    private void drawStructuredNote(StructuredPdfState st, String text, boolean total) {
        if (text == null || text.trim().isEmpty()) return;
        final int LINE = Color.rgb(217, 225, 235), SOFT = Color.rgb(250, 252, 254), INK = Color.rgb(40, 55, 76);
        float width = st.pageWidth - 2 * st.margin;
        StaticLayout layout = pdfTextLayout(text, width - 16f, total ? 9.5f : 8.8f, total, INK, 0);
        float h = Math.max(30f, layout.getHeight() + 14f);
        ensureStructuredSpace(st, h + 7f);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); fill.setColor(SOFT);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(.8f); stroke.setColor(LINE);
        st.canvas.drawRoundRect(st.margin, st.y, st.pageWidth - st.margin, st.y + h, 6f, 6f, fill);
        st.canvas.drawRoundRect(st.margin, st.y, st.pageWidth - st.margin, st.y + h, 6f, 6f, stroke);
        int save = st.canvas.save(); st.canvas.translate(st.margin + 8f, st.y + 7f); layout.draw(st.canvas); st.canvas.restoreToCount(save);
        st.y += h + 7f;
    }

    private void drawStructuredSummary(StructuredPdfState st, JSONArray items) {
        if (items == null || items.length() == 0) return;
        final int LINE = Color.rgb(217, 225, 235), SOFT = Color.rgb(250, 252, 254), INK = Color.rgb(30, 46, 68), MUTED = Color.rgb(102, 117, 138);
        float gap = 6f, colW = (st.pageWidth - 2 * st.margin - 2 * gap) / 3f;
        int rows = (items.length() + 2) / 3;
        ensureStructuredSpace(st, rows * 48f + 7f);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); fill.setColor(SOFT);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(.7f); stroke.setColor(LINE);
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i); if (item == null) continue;
            int row = i / 3, col = i % 3;
            float x = st.pageWidth - st.margin - colW - col * (colW + gap), y = st.y + row * 48f;
            st.canvas.drawRoundRect(x, y, x + colW, y + 42f, 6f, 6f, fill);
            st.canvas.drawRoundRect(x, y, x + colW, y + 42f, 6f, 6f, stroke);
            drawPdfText(st.canvas, item.optString("label"), x + 6f, y + 5f, colW - 12f, 7.2f, false, MUTED, 1);
            drawPdfText(st.canvas, item.optString("value"), x + 6f, y + 20f, colW - 12f, 9f, true, INK, 2);
        }
        st.y += rows * 48f + 2f;
    }

    private void drawStructuredAlert(StructuredPdfState st, JSONObject block) {
        final int RED = Color.rgb(180, 35, 24), PALE = Color.rgb(255, 245, 244);
        float h = 38f, width = st.pageWidth - 2 * st.margin;
        ensureStructuredSpace(st, h + 7f);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); fill.setColor(PALE);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(1.2f); stroke.setColor(RED);
        st.canvas.drawRoundRect(st.margin, st.y, st.pageWidth - st.margin, st.y + h, 6f, 6f, fill);
        st.canvas.drawRoundRect(st.margin, st.y, st.pageWidth - st.margin, st.y + h, 6f, 6f, stroke);
        drawPdfText(st.canvas, block.optString("label"), st.margin + width * .42f, st.y + 10f, width * .56f - 8f, 8.5f, true, RED, 2);
        drawPdfText(st.canvas, block.optString("value"), st.margin + 8f, st.y + 10f, width * .35f, 9.2f, true, RED, 1);
        st.y += h + 7f;
    }

    private float measureTableRow(JSONArray row, float cellW, float fontSize, boolean bold, int color, int maxLines) {
        float max = 0f;
        for (int i = 0; i < row.length(); i++) {
            StaticLayout layout = pdfTextLayout(row.optString(i), cellW - 8f, fontSize, bold, color, maxLines);
            max = Math.max(max, layout.getHeight());
        }
        return Math.max(24f, max + 10f);
    }

    private void drawTableRow(StructuredPdfState st, JSONArray row, int cols, float y, float h,
                              boolean header, int rowIndex) {
        final int NAVY = Color.rgb(17, 39, 69), LINE = Color.rgb(217, 225, 235), SOFT = Color.rgb(248, 250, 252), INK = Color.rgb(36, 52, 74);
        float width = st.pageWidth - 2 * st.margin, cellW = width / Math.max(1, cols);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); fill.setColor(header ? NAVY : (rowIndex % 2 == 1 ? SOFT : Color.WHITE));
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(.55f); stroke.setColor(LINE);
        for (int col = 0; col < cols; col++) {
            float x = st.pageWidth - st.margin - (col + 1) * cellW;
            st.canvas.drawRect(x, y, x + cellW, y + h, fill);
            st.canvas.drawRect(x, y, x + cellW, y + h, stroke);
            drawPdfText(st.canvas, col < row.length() ? row.optString(col) : "", x + 4f, y + 5f,
                    cellW - 8f, header ? 7.8f : 7.5f, header, header ? Color.WHITE : INK, header ? 2 : 4);
        }
    }

    private void drawStructuredTable(StructuredPdfState st, JSONObject block) {
        JSONArray headers = block.optJSONArray("headers"), rows = block.optJSONArray("rows");
        int cols = headers == null ? 0 : headers.length();
        if (rows != null) for (int i = 0; i < rows.length(); i++) cols = Math.max(cols, rows.optJSONArray(i) == null ? 0 : rows.optJSONArray(i).length());
        if (cols <= 0) return;
        float width = st.pageWidth - 2 * st.margin, cellW = width / cols;
        JSONArray headerRow = headers != null && headers.length() > 0 ? headers : new JSONArray();
        float headerH = headerRow.length() > 0 ? measureTableRow(headerRow, cellW, 7.8f, true, Color.WHITE, 2) : 0f;
        ensureStructuredSpace(st, Math.max(48f, headerH + 28f));
        if (headerH > 0f) { drawTableRow(st, headerRow, cols, st.y, headerH, true, 0); st.y += headerH; }
        if (rows != null) {
            for (int i = 0; i < rows.length(); i++) {
                JSONArray row = rows.optJSONArray(i); if (row == null) continue;
                float h = measureTableRow(row, cellW, 7.5f, false, Color.BLACK, 4);
                if (st.y + h > st.pageHeight - 42f) {
                    beginStructuredPage(st, true);
                    if (headerH > 0f) { drawTableRow(st, headerRow, cols, st.y, headerH, true, 0); st.y += headerH; }
                }
                drawTableRow(st, row, cols, st.y, h, false, i);
                st.y += h;
            }
        }
        st.y += 7f;
    }

    private void drawStructuredSignatures(StructuredPdfState st, JSONArray items) {
        if (items == null || items.length() == 0) return;
        ensureStructuredSpace(st, 62f);
        float gap = 18f, width = st.pageWidth - 2 * st.margin, colW = (width - gap * 2) / 3f;
        Paint line = new Paint(Paint.ANTI_ALIAS_FLAG); line.setColor(Color.rgb(130, 144, 163)); line.setStrokeWidth(.7f);
        st.y += 22f;
        for (int i = 0; i < Math.min(3, items.length()); i++) {
            float x = st.pageWidth - st.margin - colW - i * (colW + gap);
            st.canvas.drawLine(x, st.y, x + colW, st.y, line);
            drawPdfText(st.canvas, items.optString(i), x, st.y + 7f, colW, 7.5f, false, Color.rgb(70, 85, 106), 1);
        }
        st.y += 34f;
    }

    private File createStructuredPdf(String modelJson, String jobName, String orientation) throws Exception {
        JSONObject model = new JSONObject(modelJson == null ? "{}" : modelJson);
        boolean landscape = "landscape".equalsIgnoreCase(orientation);
        int pageWidth = landscape ? 842 : 595, pageHeight = landscape ? 595 : 842;
        PdfDocument document = new PdfDocument();
        StructuredPdfState st = new StructuredPdfState(document, model, pageWidth, pageHeight);
        JSONObject company = model.optJSONObject("company");
        if (company != null) st.logo = decodePdfLogo(company.optString("logo", ""));
        beginStructuredPage(st, false);
        JSONArray blocks = model.optJSONArray("blocks");
        if (blocks != null) {
            for (int i = 0; i < blocks.length(); i++) {
                JSONObject block = blocks.optJSONObject(i); if (block == null) continue;
                String type = block.optString("type", "");
                if ("meta".equals(type)) drawStructuredMeta(st, block.optJSONArray("items"));
                else if ("table".equals(type)) drawStructuredTable(st, block);
                else if ("summary".equals(type)) drawStructuredSummary(st, block.optJSONArray("items"));
                else if ("alert".equals(type)) drawStructuredAlert(st, block);
                else if ("signatures".equals(type)) drawStructuredSignatures(st, block.optJSONArray("items"));
                else if ("footer".equals(type)) {
                    JSONArray items = block.optJSONArray("items");
                    if (items != null) for (int j = 0; j < items.length(); j++) drawStructuredNote(st, items.optString(j), false);
                } else drawStructuredNote(st, block.optString("text", ""), "total".equals(type));
            }
        }
        finishStructuredPage(st);
        String safe = (jobName == null || jobName.trim().isEmpty()) ? "مستند.pdf" : jobName.trim();
        safe = safe.replaceAll("[\\/:*?\"<>|]+", " ").replaceAll("\\s+", " ").trim();
        if (!safe.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf")) safe += ".pdf";
        File file = new File(getCacheDir(), safe);
        if (file.exists() && !file.delete()) file = new File(getCacheDir(), "مستند.pdf");
        try (FileOutputStream out = new FileOutputStream(file)) { document.writeTo(out); out.flush(); }
        document.close();
        if (st.logo != null) try { st.logo.recycle(); } catch (Exception ignored) { }
        if (!file.isFile() || file.length() < 512) throw new IllegalStateException("pdf_invalid");
        return file;
    }

    private void createAndShareStructuredPdf(String modelJson, String jobName, String orientation) {
        try {
            File file = createStructuredPdf(modelJson, jobName, orientation);
            sharePdfFile(file);
        } catch (Exception e) {
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
        public void printHtmlA4(String html, String jobName, String orientation) {
            runOnUiThread(() -> {
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
                    private boolean printed = false;
                    @Override public void onPageFinished(WebView view, String url) {
                        if (printed) return;
                        printed = true;
                        afterVisualReady(view, () -> startPrint(view, jobName, resolvedOrientation));
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }

        @JavascriptInterface
        public void shareStructuredPdf(String modelJson, String jobName, String orientation) {
            runOnUiThread(() -> createAndShareStructuredPdf(modelJson, jobName, orientation));
        }
    }
}
