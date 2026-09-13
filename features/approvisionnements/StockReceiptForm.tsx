"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SearchSelect, { SearchSelectHandle } from "@/components/SearchSelect";
import { ApiError } from "@/lib/api";
import { Product } from "@/features/products/products.types";
import { fetchAllProducts } from "@/features/products/products.api";
import { useAllSuppliers } from "@/features/suppliers/suppliers.hooks";
import QuickAddProductModal from "./QuickAddProductModal";
import { createStockReceipt, updateStockReceipt } from "./approvisionnements.api";
import { StockReceipt, UnitTarget } from "./approvisionnements.types";

const DRAFT_KEY = "stock_receipt_draft";

interface LineItem {
  product_id: number;
  unit_target: UnitTarget;
  quantity: number | "";
  unitCostOverride: string;
}

interface Draft {
  supplierId: number | "";
  reference: string;
  note: string;
  lines: LineItem[];
}

const defaultLine = (): LineItem => ({ product_id: 0, unit_target: "principale", quantity: 1, unitCostOverride: "" });

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function linesFromReceipt(receipt: StockReceipt): LineItem[] {
  return receipt.lines.map((l) => ({
    product_id: l.product_id,
    unit_target: l.unit_target,
    quantity: l.quantity,
    unitCostOverride: String(l.unit_cost),
  }));
}

export default function StockReceiptForm({
  receipt,
  initialProductId,
  onSaved,
}: {
  receipt?: StockReceipt;
  initialProductId?: number;
  onSaved: (receipt: StockReceipt) => void;
}) {
  const isEdit = !!receipt;
  const [products, setProducts] = useState<Product[]>([]);
  const { allSuppliers } = useAllSuppliers();
  const [supplierId, setSupplierId] = useState<number | "">(receipt?.supplier_id || "");
  const [reference, setReference] = useState(receipt?.reference || "");
  const [note, setNote] = useState(receipt?.note || "");
  const [lines, setLines] = useState<LineItem[]>(receipt ? linesFromReceipt(receipt) : []);
  const [editor, setEditor] = useState<LineItem>(defaultLine());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const articleRef = useRef<SearchSelectHandle>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAllProducts().then((p) => {
      setProducts(p);
      if (isEdit) return;
      const draft = loadDraft();
      if (draft) {
        setSupplierId(draft.supplierId);
        setReference(draft.reference);
        setNote(draft.note);
        setLines(draft.lines);
        setDraftRestored(true);
      } else if (initialProductId) {
        const product = p.find((pr) => pr.id === initialProductId);
        if (product) {
          setEditor({
            product_id: product.id,
            unit_target: "principale",
            quantity: 1,
            unitCostOverride: product.purchase_price ? String(product.purchase_price) : "",
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(
    (sId: number | "", ref: string, n: string, ls: LineItem[]) => {
      if (isEdit) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ supplierId: sId, reference: ref, note: n, lines: ls }));
    },
    [isEdit]
  );

  function setSupplierIdAndSave(id: number | "") {
    setSupplierId(id);
    saveDraft(id, reference, note, lines);
  }

  function setReferenceAndSave(value: string) {
    setReference(value);
    saveDraft(supplierId, value, note, lines);
  }

  function setNoteAndSave(value: string) {
    setNote(value);
    saveDraft(supplierId, reference, value, lines);
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
      saveDraft(supplierId, reference, note, next);
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
      saveDraft(supplierId, reference, note, next);
      return next;
    });
    if (editingIndex === index) cancelEdit();
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setSupplierId("");
    setReference("");
    setNote("");
    setLines([]);
    cancelEdit();
    setDraftRestored(false);
  }

  function productOf(id: number) {
    return products.find((p) => p.id === id);
  }

  function numericQuantity(quantity: number | ""): number {
    return quantity === "" ? 0 : quantity;
  }

  function defaultCostFor(product: Product | undefined, unitTarget: UnitTarget): number {
    if (!product) return 0;
    return (unitTarget === "secondaire" ? product.purchase_price_secondaire : product.purchase_price) || 0;
  }

  function effectiveUnitCost(line: LineItem): number {
    if (line.unitCostOverride !== "" && !Number.isNaN(parseFloat(line.unitCostOverride))) {
      return parseFloat(line.unitCostOverride);
    }
    return defaultCostFor(productOf(line.product_id), line.unit_target);
  }

  function unitLabel(line: LineItem) {
    const product = productOf(line.product_id);
    if (!product) return "";
    if (product.is_transformable) return line.unit_target === "secondaire" ? product.unit_secondaire : product.unit;
    return product.unit || "";
  }

  function onProductCreated(product: Product) {
    setProducts((prev) => [...prev, product]);
    updateEditor({
      product_id: product.id,
      unit_target: "principale",
      unitCostOverride: product.purchase_price ? String(product.purchase_price) : "",
    });
    setShowQuickAdd(false);
    quantityRef.current?.focus();
  }

  const totalCost = lines.reduce((sum, l) => sum + effectiveUnitCost(l) * numericQuantity(l.quantity), 0);
  const editorProduct = productOf(editor.product_id);

  async function onSubmit() {
    setError("");
    const validLines = lines
      .filter((l) => l.product_id && l.quantity !== "" && l.quantity > 0)
      .map((l) => {
        const override = l.unitCostOverride !== "" ? parseFloat(l.unitCostOverride) : NaN;
        return {
          product_id: l.product_id,
          unit_target: l.unit_target,
          quantity: numericQuantity(l.quantity),
          unit_cost: Number.isNaN(override) ? null : override,
        };
      });
    if (validLines.length === 0) {
      setError("Ajoutez au moins un article valide");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: supplierId || null,
        reference: reference.trim() || null,
        note: note.trim() || null,
        lines: validLines,
      };
      const result = isEdit ? await updateStockReceipt(receipt!.id, payload) : await createStockReceipt(payload);
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement de l'approvisionnement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {!isEdit && draftRestored && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <span>Brouillon restauré depuis votre dernière session.</span>
          <button onClick={clearDraft} className="ml-4 underline text-amber-700 hover:text-amber-900">
            Effacer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
          <SearchSelect
            options={allSuppliers.map((s) => ({ id: s.id, label: s.name, sublabel: s.phone || undefined }))}
            value={supplierId}
            onChange={setSupplierIdAndSave}
            placeholder="Rechercher un fournisseur..."
            allowEmpty
            emptyLabel="-- Aucun --"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence (bon de livraison)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReferenceAndSave(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="N° du bon de livraison (optionnel)"
          />
        </div>
      </div>

      {/* Éditeur de ligne (unique) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Articles reçus</label>
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Nouveau produit
          </button>
        </div>

        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 sm:col-span-5">
            <SearchSelect
              ref={articleRef}
              options={products.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.is_transformable
                  ? `${p.quantity} ${p.unit} / ${p.quantity_secondaire} ${p.unit_secondaire} en stock`
                  : `${p.quantity} en stock`,
              }))}
              value={editor.product_id || ""}
              onChange={(id) => {
                const p = products.find((pr) => pr.id === id);
                updateEditor({
                  product_id: id || 0,
                  unit_target: "principale",
                  unitCostOverride: p ? String(defaultCostFor(p, "principale") || "") : "",
                });
              }}
              onEnter={() => quantityRef.current?.focus()}
              placeholder="Article..."
            />
          </div>

          {editorProduct?.is_transformable ? (
            <select
              value={editor.unit_target}
              onChange={(e) => {
                const target = e.target.value as UnitTarget;
                updateEditor({
                  unit_target: target,
                  unitCostOverride: editorProduct ? String(defaultCostFor(editorProduct, target) || "") : "",
                });
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
            min="0"
            value={editor.quantity}
            onChange={(e) => updateEditor({ quantity: e.target.value === "" ? "" : Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                costRef.current?.focus();
              }
            }}
            className="col-span-3 sm:col-span-1 rounded-md border border-gray-300 px-2 py-2 text-sm"
            placeholder="Qté"
          />
          <input
            ref={costRef}
            type="number"
            step="1"
            min="0"
            value={editor.unitCostOverride}
            onChange={(e) => updateEditor({ unitCostOverride: e.target.value })}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEditorLine();
              }
            }}
            className="col-span-5 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
            placeholder="Coût U"
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

        {/* Liste des lignes ajoutées */}
        {lines.length > 0 && (
          <div className="mt-4 divide-y border rounded-lg overflow-hidden">
            {lines.map((line, i) => {
              const product = productOf(line.product_id);
              const unitCost = effectiveUnitCost(line);
              const lineTotal = unitCost * numericQuantity(line.quantity);
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
                  <div className="col-span-2 text-right tabular-nums text-gray-600">{unitCost.toLocaleString()}</div>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNoteAndSave(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Note interne (optionnel)"
        />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="font-semibold text-xl tabular-nums">Coût total : {totalCost.toLocaleString()} FCFA</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white rounded-md px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer l'approvisionnement"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showQuickAdd && <QuickAddProductModal onClose={() => setShowQuickAdd(false)} onCreated={onProductCreated} />}
    </div>
  );
}
