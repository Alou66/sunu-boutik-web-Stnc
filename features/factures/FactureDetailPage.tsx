"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, Shop } from "@/lib/api";
import { Client } from "@/features/clients/clients.types";
import { fetchClient } from "@/features/clients/clients.api";
import InvoiceCopiesView from "./InvoiceCopiesView";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import PaymentHistory from "./PaymentHistory";
import PaymentModal from "./PaymentModal";
import { cancelInvoice, deleteInvoice, fetchInvoice, fetchPdfBlob } from "./factures.api";
import { Invoice } from "./factures.types";
import { buildInvoiceCopiesPdf } from "./invoiceCopiesPdf";

type ViewFormat = "a4" | "copies";

export default function FactureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; full_name: string } | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<ViewFormat>("copies");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const copiesRef = useRef<HTMLDivElement>(null);

  function loadInvoice() {
    Promise.all([
      fetchInvoice(invoiceId),
      api.get<{ user: { id: number; full_name: string }; shop: Shop | null }>("/auth/me"),
    ])
      .then(([inv, me]) => {
        setInvoice(inv);
        setShop(me.shop);
        setCurrentUser(me.user);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }

  function loadPdf() {
    setPdfLoading(true);
    fetchPdfBlob(invoiceId)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {})
      .finally(() => setPdfLoading(false));
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice?.client_id) {
      setClient(null);
      return;
    }
    fetchClient(invoice.client_id)
      .then(setClient)
      .catch(() => setClient(null));
  }, [invoice?.client_id]);

  useEffect(() => {
    if (format === "copies") return;
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, format]);

  function handlePrint() {
    if (format === "copies") {
      window.print();
    } else {
      iframeRef.current?.contentWindow?.print();
    }
  }

  function triggerDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  async function handleDownload() {
    if (!invoice) return;
    if (format === "a4") {
      if (pdfBlobUrl) triggerDownload(pdfBlobUrl, `facture-${invoice.number}-a4.pdf`);
      return;
    }
    if (!copiesRef.current) return;
    setActionError("");
    setDownloading(true);
    try {
      const blob = await buildInvoiceCopiesPdf(copiesRef.current);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `facture-${invoice.number}-2-exemplaires.pdf`);
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Impossible de générer le PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCancel() {
    const reason = prompt("Annuler cette facture — motif de l'annulation (le stock sera recrédité) :");
    if (reason === null) return;
    if (!reason.trim()) {
      setActionError("Le motif d'annulation est requis");
      return;
    }
    setActionError("");
    setCancelling(true);
    try {
      await cancelInvoice(invoiceId, reason.trim());
      loadInvoice();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement cette facture annulée ? Cette action est irréversible.")) return;
    setActionError("");
    setDeleting(true);
    try {
      await deleteInvoice(invoiceId);
      router.push("/dashboard/factures");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice || !shop) return <p className="text-gray-400">Chargement...</p>;

  const printDisabled = format !== "copies" && (!pdfBlobUrl || pdfLoading);
  const downloadDisabled = downloading || (format === "a4" && (!pdfBlobUrl || pdfLoading));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h2 className="font-semibold text-lg">Facture {invoice.number}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Format toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setFormat("a4")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                format === "a4" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              A4
            </button>
            <button
              onClick={() => setFormat("copies")}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-300 ${
                format === "copies" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              2 exemplaires
            </button>
          </div>
          {invoice.status !== "cancelled" && (
            <button
              onClick={() => router.push(`/dashboard/factures/${invoiceId}/edit`)}
              className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Modifier
            </button>
          )}
          {invoice.status !== "cancelled" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="border border-red-300 text-red-600 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Annulation..." : "Annuler la facture"}
            </button>
          )}
          {invoice.status === "cancelled" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={printDisabled}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Imprimer
          </button>
          <button
            onClick={handleDownload}
            disabled={downloadDisabled}
            className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {downloading ? "Génération..." : "Télécharger PDF"}
          </button>
        </div>
      </div>

      {actionError && <p className="no-print text-sm text-red-600">{actionError}</p>}

      {invoice.status === "cancelled" && (
        <div className="no-print bg-gray-100 border border-gray-300 rounded-xl px-4 sm:px-5 py-3 text-sm text-gray-700">
          Facture annulée{invoice.cancelled_by_name ? ` par ${invoice.cancelled_by_name}` : ""}
          {invoice.cancelled_at ? ` le ${new Date(invoice.cancelled_at).toLocaleString("fr-FR")}` : ""}
          {invoice.cancel_reason ? ` — motif : ${invoice.cancel_reason}` : ""}
        </div>
      )}

      <div className="no-print bg-white rounded-xl shadow px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <InvoiceStatusBadge status={invoice.status} />
          <div>
            <span className="text-gray-500">Payé : </span>
            <span className="font-medium">{invoice.amount_paid.toLocaleString()} FCFA</span>
          </div>
          <div>
            <span className="text-gray-500">Reste à payer : </span>
            <span className="font-semibold text-blue-700">{invoice.balance_due.toLocaleString()} FCFA</span>
          </div>
        </div>
        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Encaisser
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto print:mt-0">
        {format === "copies" ? (
          <div ref={copiesRef}>
            <InvoiceCopiesView invoice={invoice} shop={shop} client={client} />
          </div>
        ) : pdfLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Génération du PDF...
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            className="w-full h-[70vh] sm:h-[800px]"
            title="Facture"
          />
        ) : (
          <p className="p-6 text-gray-400">Génération du PDF...</p>
        )}
      </div>

      <div className="no-print">
        <PaymentHistory
          invoiceId={invoiceId}
          currentUser={currentUser}
          refreshKey={invoice.amount_paid}
          onVoided={loadInvoice}
        />
      </div>

      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadInvoice();
          }}
        />
      )}
    </div>
  );
}
