package com.elhafez.tourism.erp.customer;

import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.graphics.pdf.PdfDocument;
import android.graphics.Bitmap;
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
        // Required when a WebView is rendered into an off-screen bitmap/PDF.
        // Call before BridgeActivity creates its first WebView.
        WebView.enableSlowWholeDocumentDraw();
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
            // Keep the print WebView VISIBLE and attached so Chromium actually paints it.
            // Put it behind the main Capacitor view instead of translating it off-screen.
            view.setBackgroundColor(Color.WHITE);
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            view.setClickable(false);
            view.setFocusable(false);
            int initialHeight = Math.max(1200, root.getHeight() > 0 ? root.getHeight() : 1200);
            root.addView(view, 0, new ViewGroup.LayoutParams(794, initialHeight));
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

    private boolean bitmapHasInk(Bitmap bitmap) {
        if (bitmap == null || bitmap.getWidth() <= 0 || bitmap.getHeight() <= 0) return false;
        int stepX = Math.max(6, bitmap.getWidth() / 48);
        int stepY = Math.max(6, bitmap.getHeight() / 64);
        for (int y = 0; y < bitmap.getHeight(); y += stepY) {
            for (int x = 0; x < bitmap.getWidth(); x += stepX) {
                int c = bitmap.getPixel(x, y);
                int a = Color.alpha(c), r = Color.red(c), g = Color.green(c), b = Color.blue(c);
                if (a > 20 && (r < 246 || g < 246 || b < 246)) return true;
            }
        }
        return false;
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
        shareHtmlAsPdf(view, jobName, phone, message, 0);
    }

    private void shareHtmlAsPdf(WebView view, String jobName, String phone, String message, int attempt) {
        String safe = (jobName == null || jobName.trim().isEmpty()) ? "document" : jobName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        File file = new File(getCacheDir(), safe + "_" + System.currentTimeMillis() + ".pdf");
        final int pageWidth = 595, pageHeight = 842, margin = 24, renderWidth = 794;
        PdfDocument pdf = new PdfDocument();
        try {
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            int widthSpec = View.MeasureSpec.makeMeasureSpec(renderWidth, View.MeasureSpec.EXACTLY);
            int heightSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            view.measure(widthSpec, heightSpec);
            int measuredHeight = Math.max(1, view.getMeasuredHeight());
            int chromiumHeight = Math.max(1, Math.round(view.getContentHeight() * view.getScale()));
            int contentHeight = Math.max(measuredHeight, chromiumHeight);
            if (contentHeight <= 2) throw new IllegalStateException("pdf_content_not_ready");
            view.measure(widthSpec, View.MeasureSpec.makeMeasureSpec(contentHeight, View.MeasureSpec.EXACTLY));
            view.layout(0, 0, renderWidth, contentHeight);

            float scale = (pageWidth - (margin * 2f)) / renderWidth;
            float sourcePageHeight = (pageHeight - (margin * 2f)) / scale;
            int pageCount = Math.max(1, (int) Math.ceil(contentHeight / sourcePageHeight));
            boolean firstPageHasInk = false;

            for (int i = 0; i < pageCount; i++) {
                // Rasterize the WebView into a software bitmap first. Chromium/WebView can
                // otherwise return an empty frame when drawn directly into PdfDocument.
                Bitmap bitmap = Bitmap.createBitmap(pageWidth, pageHeight, Bitmap.Config.ARGB_8888);
                Canvas bitmapCanvas = new Canvas(bitmap);
                bitmapCanvas.drawColor(Color.WHITE);
                bitmapCanvas.save();
                bitmapCanvas.clipRect(margin, margin, pageWidth - margin, pageHeight - margin);
                bitmapCanvas.translate(margin, margin);
                bitmapCanvas.scale(scale, scale);
                bitmapCanvas.translate(0, -(i * sourcePageHeight));
                view.draw(bitmapCanvas);
                bitmapCanvas.restore();

                if (i == 0) firstPageHasInk = bitmapHasInk(bitmap);

                PdfDocument.PageInfo info = new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, i + 1).create();
                PdfDocument.Page page = pdf.startPage(info);
                page.getCanvas().drawColor(Color.WHITE);
                page.getCanvas().drawBitmap(bitmap, 0, 0, null);
                pdf.finishPage(page);
                bitmap.recycle();
            }

            if (!firstPageHasInk) {
                try { pdf.close(); } catch (Exception ignored) { }
                if (attempt < 2) {
                    view.postDelayed(() -> afterVisualReady(view, () -> shareHtmlAsPdf(view, jobName, phone, message, attempt + 1)), 220);
                    return;
                }
                throw new IllegalStateException("pdf_render_blank");
            }

            try (FileOutputStream out = new FileOutputStream(file)) { pdf.writeTo(out); out.flush(); }
            pdf.close();
            destroyPrintView(view);
            if (!file.isFile() || file.length() <= 0) throw new IllegalStateException("pdf_file_empty");
            sharePdfFile(file, phone, message);
        } catch (Exception e) {
            try { pdf.close(); } catch (Exception ignored) { }
            if (attempt < 2 && "pdf_content_not_ready".equals(e.getMessage())) {
                view.postDelayed(() -> afterVisualReady(view, () -> shareHtmlAsPdf(view, jobName, phone, message, attempt + 1)), 220);
                return;
            }
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
                printView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
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
        public void sharePdf(String html, String jobName, String phone, String message) {
            runOnUiThread(() -> {
                final WebView printView = new WebView(MainActivity.this);
                attachPrintView(printView);
                printView.getSettings().setJavaScriptEnabled(false);
                printView.getSettings().setDomStorageEnabled(false);
                printView.getSettings().setLoadsImagesAutomatically(true);
                printView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
                printView.setWebViewClient(new WebViewClient() {
                    private boolean shared = false;
                    @Override public void onPageFinished(WebView view, String url) {
                        if (shared) return;
                        shared = true;
                        afterVisualReady(view, () -> shareHtmlAsPdf(view, jobName, phone, message));
                    }
                });
                printView.loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }
    }
}
