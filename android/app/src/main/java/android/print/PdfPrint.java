package android.print;

import android.content.Context;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;

import java.io.File;

/**
 * Chromium/WebView PDF exporter.
 *
 * This class intentionally lives in android.print so it can instantiate the
 * framework callback classes whose constructors are package-visible on some
 * Android releases. It delegates PDF generation to WebView's own
 * PrintDocumentAdapter; no Canvas, Bitmap or screenshot rendering is used.
 */
public final class PdfPrint {
    private PdfPrint() { }

    public interface Result {
        void onSuccess(File file);
        void onError(String message);
    }

    public static void write(Context context,
                             PrintDocumentAdapter adapter,
                             PrintAttributes attributes,
                             File output,
                             Result result) {
        if (adapter == null || output == null || result == null) return;
        CancellationSignal cancellation = new CancellationSignal();
        try {
            adapter.onStart();
            adapter.onLayout(null, attributes, cancellation,
                    new PrintDocumentAdapter.LayoutResultCallback() {
                        @Override
                        public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                            ParcelFileDescriptor pfd = null;
                            try {
                                File parent = output.getParentFile();
                                if (parent != null && !parent.exists()) parent.mkdirs();
                                pfd = ParcelFileDescriptor.open(output,
                                        ParcelFileDescriptor.MODE_CREATE
                                                | ParcelFileDescriptor.MODE_TRUNCATE
                                                | ParcelFileDescriptor.MODE_READ_WRITE);
                                final ParcelFileDescriptor destination = pfd;
                                adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, destination,
                                        cancellation, new PrintDocumentAdapter.WriteResultCallback() {
                                            private void closeDestination() {
                                                try { destination.close(); } catch (Exception ignored) { }
                                                try { adapter.onFinish(); } catch (Exception ignored) { }
                                            }

                                            @Override
                                            public void onWriteFinished(PageRange[] pages) {
                                                closeDestination();
                                                if (output.isFile() && output.length() > 0) result.onSuccess(output);
                                                else result.onError("pdf_empty");
                                            }

                                            @Override
                                            public void onWriteFailed(CharSequence error) {
                                                closeDestination();
                                                result.onError(error == null ? "pdf_write_failed" : error.toString());
                                            }

                                            @Override
                                            public void onWriteCancelled() {
                                                closeDestination();
                                                result.onError("pdf_write_cancelled");
                                            }
                                        });
                            } catch (Exception e) {
                                try { if (pfd != null) pfd.close(); } catch (Exception ignored) { }
                                try { adapter.onFinish(); } catch (Exception ignored) { }
                                result.onError(e.getMessage() == null ? "pdf_write_failed" : e.getMessage());
                            }
                        }

                        @Override
                        public void onLayoutFailed(CharSequence error) {
                            try { adapter.onFinish(); } catch (Exception ignored) { }
                            result.onError(error == null ? "pdf_layout_failed" : error.toString());
                        }

                        @Override
                        public void onLayoutCancelled() {
                            try { adapter.onFinish(); } catch (Exception ignored) { }
                            result.onError("pdf_layout_cancelled");
                        }
                    }, null);
        } catch (Exception e) {
            try { adapter.onFinish(); } catch (Exception ignored) { }
            result.onError(e.getMessage() == null ? "pdf_failed" : e.getMessage());
        }
    }
}
