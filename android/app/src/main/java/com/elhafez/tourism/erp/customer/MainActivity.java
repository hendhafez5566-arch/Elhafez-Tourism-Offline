package com.elhafez.tourism.erp.customer;

import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.pdf.PdfDocument;
import android.graphics.Color;
import android.graphics.Canvas;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
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
        public void reload() {
            runOnUiThread(() -> getBridge().getWebView().reload());
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::finishAndRemoveTask);
        }
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

    private void attachPrintView(WebView view) {
        try {
            ViewGroup root = findViewById(android.R.id.content);
            if (root == null || view.getParent() != null) return;
            view.setAlpha(0.01f);
            view.setTranslationX(-10000f);
            root.addView(view, new ViewGroup.LayoutParams(1, 1));
        } catch (Exception ignored) { }
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

    private void shareHtmlAsPdf(WebView view, String jobName, String phone, String message) {
        String safe = (jobName == null || jobName.trim().isEmpty()) ? "document" : jobName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        File file = new File(getCacheDir(), safe + "_" + System.currentTimeMillis() + ".pdf");
        final int pageWidth = 595, pageHeight = 842, margin = 24, renderWidth = 794;
        PdfDocument pdf = new PdfDocument();
        try {
            int widthSpec = View.MeasureSpec.makeMeasureSpec(renderWidth, View.MeasureSpec.EXACTLY);
            int heightSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            view.measure(widthSpec, heightSpec);
            int measuredHeight = Math.max(1, view.getMeasuredHeight());
            int contentHeight = Math.max(measuredHeight, Math.round(view.getContentHeight() * view.getScale()));
            view.measure(widthSpec, View.MeasureSpec.makeMeasureSpec(contentHeight, View.MeasureSpec.EXACTLY));
            view.layout(0, 0, renderWidth, contentHeight);
            float scale = (pageWidth - (margin * 2f)) / renderWidth;
            float sourcePageHeight = (pageHeight - (margin * 2f)) / scale;
            int pageCount = Math.max(1, (int) Math.ceil(contentHeight / sourcePageHeight));
            for (int i = 0; i < pageCount; i++) {
                PdfDocument.PageInfo info = new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, i + 1).create();
                PdfDocument.Page page = pdf.startPage(info);
                Canvas canvas = page.getCanvas();
                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.clipRect(margin, margin, pageWidth - margin, pageHeight - margin);
                canvas.translate(margin, margin);
                canvas.scale(scale, scale);
                canvas.translate(0, -(i * sourcePageHeight));
                view.draw(canvas);
                canvas.restore();
                pdf.finishPage(page);
            }
            try (FileOutputStream out = new FileOutputStream(file)) { pdf.writeTo(out); out.flush(); }
            pdf.close();
            destroyPrintView(view);
            if (!file.isFile() || file.length() <= 0) throw new IllegalStateException("pdf_file_empty");
            sharePdfFile(file, phone, message);
        } catch (Exception e) {
            try { pdf.close(); } catch (Exception ignored) { }
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
                printView.setWebViewClient(new WebViewClient() {
                    private boolean printed = false;
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (printed) return;
                        printed = true;
                        startPrint(view, jobName);
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }

        @JavascriptInterface
        public void sharePdf(String html, String jobName, String phone, String message) {
            runOnUiThread(() -> {
                final WebView printView = new WebView(MainActivity.this);
                attachPrintView(printView);
                printView.getSettings().setJavaScriptEnabled(false);
                printView.getSettings().setDomStorageEnabled(false);
                printView.setWebViewClient(new WebViewClient() {
                    private boolean shared = false;
                    @Override public void onPageFinished(WebView view, String url) {
                        if (shared) return;
                        shared = true;
                        view.postDelayed(() -> shareHtmlAsPdf(view, jobName, phone, message), 220);
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }
    }
}
