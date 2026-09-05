package com.elhafez.tourism.erp.customer;

import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final int PICK_PHONE_REQUEST = 4317;
    private String pendingContactField = "";
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
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
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

    private Intent buildPdfShareIntent(File file, Uri uri, String phone, String message, String packageName) {
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("application/pdf");
        share.putExtra(Intent.EXTRA_STREAM, uri);
        if (message != null && !message.trim().isEmpty()) share.putExtra(Intent.EXTRA_TEXT, message.trim());
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]+", "");
        if (!digits.isEmpty()) share.putExtra("jid", digits + "@s.whatsapp.net");
        share.setClipData(ClipData.newRawUri("Elhafez PDF", uri));
        share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (packageName != null && !packageName.trim().isEmpty()) {
            share.setPackage(packageName.trim());
            grantUriPermission(packageName.trim(), uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
        return share;
    }

    private void sharePdfFile(File file, String phone, String message) {
        try {
            if (file == null || !file.isFile() || file.length() <= 0) {
                notifyPdfShare("error", "ملف PDF غير صالح للمشاركة");
                return;
            }
            Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
            try {
                startActivity(buildPdfShareIntent(file, uri, phone, message, "com.whatsapp"));
                notifyPdfShare("success", "تم تجهيز ملف PDF وفتح واتساب");
                return;
            } catch (ActivityNotFoundException ignored) { }
            try {
                startActivity(buildPdfShareIntent(file, uri, phone, message, "com.whatsapp.w4b"));
                notifyPdfShare("success", "تم تجهيز ملف PDF وفتح واتساب Business");
                return;
            } catch (ActivityNotFoundException ignored) { }
            startActivity(Intent.createChooser(buildPdfShareIntent(file, uri, phone, message, null), "مشاركة ملف PDF"));
            notifyPdfShare("success", "تم تجهيز ملف PDF وفتح قائمة المشاركة");
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
                .setMinMargins(new PrintAttributes.Margins(0, 0, 0, 0))
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .build();
    }

    private void closePrintAdapter(PrintDocumentAdapter adapter, ParcelFileDescriptor descriptor, WebView view) {
        try { if (descriptor != null) descriptor.close(); } catch (Exception ignored) { }
        try { if (adapter != null) adapter.onFinish(); } catch (Exception ignored) { }
        destroyPrintView(view);
    }

    private void shareHtmlAsPdf(WebView view, String jobName, String phone, String message) {
        shareHtmlAsPdf(view, jobName, phone, message, "portrait");
    }

    private void shareHtmlAsPdf(WebView view, String jobName, String phone, String message, String orientation) {
        final String safe = (jobName == null || jobName.trim().isEmpty())
                ? "document"
                : jobName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        final File file = new File(getCacheDir(), safe + "_" + System.currentTimeMillis() + ".pdf");
        final boolean landscape = "landscape".equalsIgnoreCase(orientation);
        final PrintAttributes attributes = buildPdfAttributes(landscape);
        final PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(safe);
        final CancellationSignal cancellation = new CancellationSignal();

        try {
            adapter.onStart();
            adapter.onLayout(attributes, attributes, cancellation,
                    new PrintDocumentAdapter.LayoutResultCallback() {
                        @Override
                        public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                            final ParcelFileDescriptor descriptor;
                            try {
                                descriptor = ParcelFileDescriptor.open(file,
                                        ParcelFileDescriptor.MODE_CREATE |
                                        ParcelFileDescriptor.MODE_TRUNCATE |
                                        ParcelFileDescriptor.MODE_READ_WRITE);
                            } catch (Exception e) {
                                closePrintAdapter(adapter, null, view);
                                notifyPdfShare("error", "تعذر إنشاء ملف PDF للمشاركة");
                                return;
                            }

                            adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, descriptor, cancellation,
                                    new PrintDocumentAdapter.WriteResultCallback() {
                                        @Override
                                        public void onWriteFinished(PageRange[] pages) {
                                            closePrintAdapter(adapter, descriptor, view);
                                            if (!file.isFile() || file.length() <= 0) {
                                                notifyPdfShare("error", "تم إنشاء ملف PDF فارغ");
                                                return;
                                            }
                                            sharePdfFile(file, phone, message);
                                        }

                                        @Override
                                        public void onWriteFailed(CharSequence error) {
                                            closePrintAdapter(adapter, descriptor, view);
                                            try { file.delete(); } catch (Exception ignored) { }
                                            notifyPdfShare("error", "تعذر كتابة ملف PDF للمشاركة");
                                        }

                                        @Override
                                        public void onWriteCancelled() {
                                            closePrintAdapter(adapter, descriptor, view);
                                            try { file.delete(); } catch (Exception ignored) { }
                                            notifyPdfShare("error", "تم إلغاء تجهيز ملف PDF");
                                        }
                                    });
                        }

                        @Override
                        public void onLayoutFailed(CharSequence error) {
                            closePrintAdapter(adapter, null, view);
                            try { file.delete(); } catch (Exception ignored) { }
                            notifyPdfShare("error", "تعذر تجهيز صفحات PDF");
                        }

                        @Override
                        public void onLayoutCancelled() {
                            closePrintAdapter(adapter, null, view);
                            try { file.delete(); } catch (Exception ignored) { }
                            notifyPdfShare("error", "تم إلغاء تجهيز صفحات PDF");
                        }
                    }, new Bundle());
        } catch (Exception e) {
            closePrintAdapter(adapter, null, view);
            try { file.delete(); } catch (Exception ignored) { }
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
        public void sharePdfA4(String html, String jobName, String phone, String message, String orientation) {
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
                        afterVisualReady(view, () -> shareHtmlAsPdf(view, jobName, phone, message, landscape ? "landscape" : "portrait"));
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }

        @JavascriptInterface
        public void sharePdf(String html, String jobName, String phone, String message) {
            sharePdfA4(html, jobName, phone, message, "portrait");
        }
    }
}
