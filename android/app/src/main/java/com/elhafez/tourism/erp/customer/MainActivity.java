package com.elhafez.tourism.erp.customer;

import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PrintAttributes;
import android.print.PageRange;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;

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

    private void finishPdfAdapter(PrintDocumentAdapter adapter, WebView view) {
        try { adapter.onFinish(); } catch (Exception ignored) { }
        try { view.destroy(); } catch (Exception ignored) { }
    }

    private void sharePdfFile(File file, String phone, String message) throws Exception {
        if (file == null || !file.isFile() || file.length() <= 0) throw new IllegalStateException("pdf_file_empty");
        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
        Intent base = new Intent(Intent.ACTION_SEND);
        base.setType("application/pdf");
        base.putExtra(Intent.EXTRA_STREAM, uri);
        base.putExtra(Intent.EXTRA_TEXT, message == null ? "" : message);
        base.setClipData(ClipData.newRawUri("Elhafez Tourism PDF", uri));
        base.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (!digits.isEmpty()) base.putExtra("jid", digits + "@s.whatsapp.net");

        try {
            Intent wa = new Intent(base);
            wa.setPackage("com.whatsapp");
            startActivity(wa);
            notifyPdfShare("success", "تم تجهيز ملف PDF وفتح واتساب");
            return;
        } catch (Exception ignored) { }
        try {
            Intent biz = new Intent(base);
            biz.setPackage("com.whatsapp.w4b");
            startActivity(biz);
            notifyPdfShare("success", "تم تجهيز ملف PDF وفتح واتساب Business");
            return;
        } catch (Exception ignored) { }

        startActivity(Intent.createChooser(base, "مشاركة PDF"));
        notifyPdfShare("success", "تم تجهيز ملف PDF وفتح قائمة المشاركة");
    }

    private void shareHtmlAsPdf(WebView view, String jobName, String phone, String message) {
        String safe = (jobName == null || jobName.trim().isEmpty()) ? "document" : jobName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        File file = new File(getCacheDir(), safe + "_" + System.currentTimeMillis() + ".pdf");
        PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName == null ? "Elhafez ERP" : jobName);
        PrintAttributes attrs = new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).setColorMode(PrintAttributes.COLOR_MODE_COLOR).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build();
        CancellationSignal cancel = new CancellationSignal();
        AtomicBoolean completed = new AtomicBoolean(false);
        Runnable failTimeout = () -> {
            if (!completed.compareAndSet(false, true)) return;
            finishPdfAdapter(adapter, view);
            notifyPdfShare("error", "تعذر تجهيز ملف PDF داخل التطبيق. حاول مرة أخرى.");
        };

        try {
            adapter.onStart();
            view.postDelayed(failTimeout, 12000);
            Bundle extras = new Bundle();
            extras.putBoolean(PrintDocumentAdapter.EXTRA_PRINT_PREVIEW, false);
            adapter.onLayout(attrs, attrs, cancel, new PrintDocumentAdapter.LayoutResultCallback() {
                @Override public void onLayoutFinished(android.print.PrintDocumentInfo info, boolean changed) {
                    if (completed.get()) return;
                    try {
                        ParcelFileDescriptor fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE | ParcelFileDescriptor.MODE_READ_WRITE);
                        adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, fd, cancel, new PrintDocumentAdapter.WriteResultCallback() {
                            private void closeFd() { try { fd.close(); } catch (Exception ignored) { } }
                            @Override public void onWriteFinished(PageRange[] pages) {
                                closeFd();
                                if (!completed.compareAndSet(false, true)) return;
                                try {
                                    if (!file.isFile() || file.length() <= 0) throw new IllegalStateException("pdf_file_empty");
                                    finishPdfAdapter(adapter, view);
                                    sharePdfFile(file, phone, message);
                                } catch (Exception e) {
                                    finishPdfAdapter(adapter, view);
                                    notifyPdfShare("error", "تم تجهيز المستند لكن تعذر فتح واتساب للمشاركة");
                                }
                            }
                            @Override public void onWriteFailed(CharSequence error) {
                                closeFd();
                                if (!completed.compareAndSet(false, true)) return;
                                finishPdfAdapter(adapter, view);
                                notifyPdfShare("error", "تعذر إنشاء ملف PDF: " + (error == null ? "خطأ غير معروف" : error));
                            }
                            @Override public void onWriteCancelled() {
                                closeFd();
                                if (!completed.compareAndSet(false, true)) return;
                                finishPdfAdapter(adapter, view);
                                notifyPdfShare("error", "تم إلغاء تجهيز ملف PDF");
                            }
                        });
                    } catch (Exception e) {
                        if (!completed.compareAndSet(false, true)) return;
                        finishPdfAdapter(adapter, view);
                        notifyPdfShare("error", "تعذر إنشاء ملف PDF للمشاركة");
                    }
                }
                @Override public void onLayoutFailed(CharSequence error) {
                    if (!completed.compareAndSet(false, true)) return;
                    finishPdfAdapter(adapter, view);
                    notifyPdfShare("error", "تعذر تجهيز صفحات PDF: " + (error == null ? "خطأ غير معروف" : error));
                }
                @Override public void onLayoutCancelled() {
                    if (!completed.compareAndSet(false, true)) return;
                    finishPdfAdapter(adapter, view);
                    notifyPdfShare("error", "تم إلغاء تجهيز صفحات PDF");
                }
            }, extras);
        } catch (Exception e) {
            if (completed.compareAndSet(false, true)) {
                finishPdfAdapter(adapter, view);
                notifyPdfShare("error", "تعذر بدء تجهيز ملف PDF");
            }
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
