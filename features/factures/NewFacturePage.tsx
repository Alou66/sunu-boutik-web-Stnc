"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchSelect, { SearchSelectHandle } from "@/components/SearchSelect";
import { ApiError } from "@/lib/api";
import { Client } from "@/features/clients/clients.types";
import { fetchAllClients } from "@/features/clients/clients.api";
import { Product, ProductForm } from "@/features/products/products.types";
import { fetchAllProducts } from "@/features/products/products.api";
import { createInvoice } from "./factures.api";

const DRAFT_KEY = "invoice_draft";

interface LineItem {
  product_id: number;
  quantity: number | "";
  saleUnit: "unite" | "carton";
  unitPriceOverride: string;
  form: ProductForm;
}

interface Draft {
  clientId: number | "";
  clientName: string;
  lines: LineItem[];
}

const defaultLine = (): LineItem => ({ product_id: 0, quantity: 1, saleUnit: "unite", unitPriceOverride: "", form: "principale" });

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function NewFacturePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [editor, setEditor] = useState<LineItem>(defaultLine());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const articleRef = useRef<SearchSelectHandle>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const [p, c] = await Promise.all([fetchAllProducts(), fetchAllClients()]);
      setProducts(p);
      setClients(c);

      const draft = loadDraft();
      if (draft) {
        setClientId(draft.clientId);
        setClientName(draft.clientName);
        setLines(draft.lines);
        setDraftRestored(true);
      }
    }
    loadData();
  }, []);

  const saveDraft = useCallback((cId: number | "", cName: string, ls: LineItem[]) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId: cId, clientName: cName, lines: ls }));
  }, []);

  function setClientIdAndSave(id: number | "") {
    setClientId(id);
    saveDraft(id, clientName, lines);
  }

  function setClientNameAndSave(name: string) {
    setClientName(name);
    saveDraft(clientId, name, lines);
  }

  function updateEditor(patch: Partial<LineItem>) {
    setEditor((prev) => ({ ...prev, ...patch }));
  }

  function commitEditorLine() {
    if (!editor.product_id || editor.quantity === "" || editor.quantity <= 0) {
      setError("Choisissez un article et une quantité valide");
      return;
    }
    setError("");
    setLines((prev) => {
      const next = editingIndex !== null ? prev.map((l, i) => (i === editingIndex ? editor : l)) : [...prev, editor];
      saveDraft(clientId, clientName, next);
      return next;
    });
    setEditor(defaultLine());
    setEditingIndex(null);
    articleRef.current?.focus();
  }

  function editLine(index: number) {
    setEditor(lines[index]);
    setEditingIndex(index);
    setError("");
  }

  function cancelEdit() {
    setEditor(defaultLine());
    setEditingIndex(null);
  }

  function removeLine(index: number) {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveDraft(clientId, clientName, next);
      return next;
    });
    if (editingIndex === index) cancelEdit();
  }

  function productOf(id: number) {
    return products.find((p) => p.id === id);
  }

  function numericQuantity(quantity: number | ""): number {
    return quantity === "" ? 0 : quantity;
  }

  function baseQuantity(line: LineItem) {
    const product = productOf(line.product_id);
    const packSize = product?.pack_size || 1;
    const qty = numericQuantity(line.quantity);
    return line.saleUnit === "carton" ? qty * packSize : qty;
  }

  function effectiveUnitPrice(line: LineItem) {
    const product = productOf(line.product_id);
    if (line.unitPriceOverride !== "" && !Number.isNaN(parseFloat(line.unitPriceOverride))) {
      return parseFloat(line.unitPriceOverride);
    }
    if (product?.is_transformable && line.form === "secondaire") {
      return product.unit_price_secondaire || 0;
    }
    return product?.unit_price || 0;
  }

  function availableStock(line: LineItem) {
    const product = productOf(line.product_id);
    if (!product) return undefined;
    if (product.is_transformable && line.form === "secondaire") return product.quantity_secondaire;
    return product.quantity;
  }

  function unitLabel(line: LineItem) {
    const product = productOf(line.product_id);
    if (!product) return "";
    if ((product.pack_size || 1) > 1) return line.saleUnit === "carton" ? "Carton" : "Unité";
    if (product.is_transformable) return line.form === "secondaire" ? product.unit_secondaire : product.unit;
    return product.unit || "";
  }

  const total = lines.reduce((sum, l) => sum + effectiveUnitPrice(l) * baseQuantity(l), 0);
  const editorProduct = productOf(editor.product_id);
  const editorHasPack = (editorProduct?.pack_size || 1) > 1;

  async function onSubmit() {
    setError("");
    const validLines = lines
      .filter((l) => l.product_id && l.quantity !== "" && l.quantity > 0)
      .map((l) => {
        const override = l.unitPriceOverride !== "" ? parseFloat(l.unitPriceOverride) : NaN;
        const product = productOf(l.product_id);
        return {
          product_id: l.product_id,
          quantity: baseQuantity(l),
          unit_price: Number.isNaN(override) ? null : override,
          form: product?.is_transformable ? l.form : null,
        };
      });
    if (validLines.length === 0) {
      setError("Ajoutez au moins un article valide");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createInvoice({
        client_id: clientId || null,
        client_name: clientId ? null : clientName.trim() || null,
        note: null,
        lines: validLines,
      });
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/dashboard/factures/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création de la facture");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Nouvelle facture</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      {draftRestored && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <span>Brouillon restauré depuis votre dernière session.</span>
          <button
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              setClientId("");
              setClientName("");
              setLines([]);
              cancelEdit();
              setDraftRestored(false);
            }}
            className="ml-4 underline text-amber-700 hover:text-amber-900"
          >
            Effacer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-5">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <SearchSelect
            options={clients.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone || undefined }))}
            value={clientId}
            onChange={setClientIdAndSave}
            placeholder="Rechercher un client ou saisir un nom..."
            allowEmpty
            emptyLabel="-- Aucun --"
            allowFreeText
            freeTextValue={clientName}
            onFreeTextChange={setClientNameAndSave}
          />
        </div>

        {/* Éditeur de ligne (unique) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Articles</label>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 sm:col-span-5">
              <SearchSelect
                ref={articleRef}
                options={products.map((p) => ({
                  id: p.id,
                  label: p.name,
                  sublabel: p.is_transformable
                    ? `${p.quantity} ${p.unit} / ${p.quantity_secondaire} ${p.unit_secondaire} dispo.`
                    : `${p.quantity} dispo.${p.pack_size > 1 ? ` — carton ${p.pack_size}` : ""}`,
                }))}
                value={editor.product_id || ""}
                onChange={(id) => {
                  const p = products.find((pr) => pr.id === id);
                  updateEditor({
                    product_id: id || 0,
                    saleUnit: "unite",
                    form: "principale",
                    unitPriceOverride: p ? String(p.unit_price) : "",
                  });
                }}
                onEnter={() => quantityRef.current?.focus()}
                placeholder="Article..."
              />
            </div>

            {editorHasPack ? (
              <select
                value={editor.saleUnit}
                onChange={(e) => updateEditor({ saleUnit: e.target.value as "unite" | "carton" })}
                className="col-span-6 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="unite">Unité</option>
                <option value="carton">Carton</option>
              </select>
            ) : editorProduct?.is_transformable ? (
              <select
                value={editor.form}
                onChange={(e) => {
                  const f = e.target.value as ProductForm;
                  const price = f === "secondaire" ? editorProduct.unit_price_secondaire : editorProduct.unit_price;
                  updateEditor({ form: f, unitPriceOverride: price != null ? String(price) : "" });
                }}
                className="col-span-6 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="principale">{editorProduct.unit}</option>
                <option value="secondaire">{editorProduct.unit_secondaire}</option>
              </select>
            ) : (
              <div className="hidden sm:block sm:col-span-2" />
            )}

            <input
              ref={quantityRef}
              type="number"
              step="0.1"
              min="1"
              value={editor.quantity}
              onChange={(e) => updateEditor({ quantity: e.target.value === "" ? "" : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  priceRef.current?.focus();
                }
              }}
              className={`col-span-3 sm:col-span-1 rounded-md border px-2 py-2 text-sm ${
                editorProduct && (availableStock(editor) ?? 0) < (editor.quantity || 0) ? "border-red-400 text-red-600" : "border-gray-300"
              }`}
              placeholder="Qté"
            />
            <input
              ref={priceRef}
              type="number"
              step="1"
              min="0"
              value={editor.unitPriceOverride}
              onChange={(e) => updateEditor({ unitPriceOverride: e.target.value })}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEditorLine();
                }
              }}
              className="col-span-5 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
              placeholder="Prix U"
            />
            <div className="col-span-4 sm:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={commitEditorLine}
                className="w-full bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700"
              >
                {editingIndex !== null ? "Modifier" : "+ Ajouter"}
              </button>
            </div>
          </div>
          {editingIndex !== null && (
            <button type="button" onClick={cancelEdit} className="mt-2 text-xs text-gray-500 hover:underline">
              Annuler la modification
            </button>
          )}

          {/* Liste des articles ajoutés */}
          {lines.length > 0 && (
            <div className="mt-4 divide-y border rounded-lg overflow-hidden">
              {lines.map((line, i) => {
                const product = productOf(line.product_id);
                const unitPrice = effectiveUnitPrice(line);
                const lineTotal = unitPrice * baseQuantity(line);
                return (
                  <div
                    key={i}
                    onClick={() => editLine(i)}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      editingIndex === i ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="col-span-5 sm:col-span-4 truncate font-medium">{product?.name || "—"}</div>
                    <div className="col-span-3 sm:col-span-2 text-gray-500">{unitLabel(line)}</div>
                    <div className="hidden sm:block sm:col-span-1 text-right tabular-nums">{numericQuantity(line.quantity)}</div>
                    <div className="col-span-2 text-right tabular-nums text-gray-600">{unitPrice.toLocaleString()}</div>
                    <div className="col-span-2 sm:col-span-2 text-right tabular-nums font-medium">{lineTotal.toLocaleString()}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLine(i);
                      }}
                      className="col-span-1 text-red-500 hover:text-red-700 text-center text-sm"
                      title="Supprimer"
                    >
                      × suppr
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total + soumettre */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-semibold text-xl tabular-nums">
            Total : {total.toLocaleString()} FCFA
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white rounded-md px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer la facture"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
