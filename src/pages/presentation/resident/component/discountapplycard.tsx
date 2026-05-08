// ─── DiscountApplyCard.tsx ────────────────────────────────────────────────────
// Uses your existing SearchableSelect component for discount picking.

import React, { useMemo, useState } from "react";
import { DISCOUNT_STATUS, DISCOUNT_TYPE } from "../../../../common/constant";
import { Badge, Button, Spinner }         from "../../../../components/bootstrap";
import Icon                               from "../../../../components/icon";
import { priceFormat }                    from "../../../../helpers/helpers";
import { IDiscountMaster, IInvoiceDiscount } from "../../../../common/interface/invoice/invoiceform";
import { buildInvoiceDiscount, getAppliedDiscountLabel, getDiscountStatus, validateDiscount } from "../../../../helpers/invoice/invoiceform.helpers";
import { SearchableSelect } from "../../../../components/common";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscountApplyCardProps {
    discountList     : IDiscountMaster[];
    isLoading       ?: boolean;
    /** IInvoiceModel.discounts[] */
    appliedDiscounts : IInvoiceDiscount[];
    /** IInvoiceModel.totalPrice — gross before discounts */
    invoiceBase      : number;
    onApply : (discount: IInvoiceDiscount) => void;
    onRemove: (discountId: string) => void;
}

// ─── renderLabel for SearchableSelect ────────────────────────────────────────
// Two-row rich display inside the dropdown:
//   Row 1 — DISC11  Ramzan  [40% off]
//   Row 2 — 2026-03-01 → 2026-04-30  ·  5 uses left  ·  Min £100

function renderDiscountOption(d: IDiscountMaster): React.ReactNode {
    const status    = getDiscountStatus(d);
    const unavail   = status !== DISCOUNT_STATUS.ACTIVE;
    const remaining = Number(d.usageLimit) - Number(d.usedCount);

    return (
        <div
            className="d-flex flex-column gap-1 w-100"
            style={{ opacity: unavail ? 0.5 : 1 }}
        >
            {/* Row 1 */}
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{d.code}</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>{d.name}</span>
                </div>

                {status === DISCOUNT_STATUS.INACTIVE && (
                    <Badge isLight color="danger"  className="px-2 py-1" style={{ fontSize: 11 }}>Inactive</Badge>
                )}
                {status === DISCOUNT_STATUS.EXPIRED && (
                    <Badge isLight color="warning" className="px-2 py-1" style={{ fontSize: 11 }}>Expired</Badge>
                )}
                {status === "NOT_STARTED" && (
                    <Badge isLight color="warning" className="px-2 py-1" style={{ fontSize: 11 }}>Starts {d.startDate}</Badge>
                )}
                {status === DISCOUNT_STATUS.ACTIVE && (
                    d.discountType === DISCOUNT_TYPE.PERCENTAGE
                        ? <Badge isLight color="info"    className="px-2 py-1" style={{ fontSize: 11 }}>{d.discountValue}% off</Badge>
                        : <Badge isLight color="success" className="px-2 py-1" style={{ fontSize: 11 }}>{priceFormat(Number(d.discountAmount))} off</Badge>
                )}
            </div>

            {/* Row 2 — meta */}
            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: 11 }}>
                <span>{d.startDate} → {d.endDate}</span>
                <span className="mx-1">·</span>
                <span style={{ color: remaining <= 1 ? "var(--bs-warning)" : undefined }}>
                    {remaining} use{remaining !== 1 ? "s" : ""} left
                </span>
                {Number(d.minAmount) > 0 && (
                    <><span className="mx-1">·</span><span>Min {priceFormat(Number(d.minAmount))}</span></>
                )}
                {Number(d.maxDiscountAmount) > 0 && (
                    <><span className="mx-1">·</span><span>Cap {priceFormat(Number(d.maxDiscountAmount))}</span></>
                )}
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DiscountApplyCard: React.FC<DiscountApplyCardProps> = ({
    discountList,
    isLoading = false,
    appliedDiscounts,
    invoiceBase,
    onApply,
    onRemove,
}) => {
    const [selectedDiscountId, setSelectedDiscountId] = useState<string>("");
    const [error,              setError]              = useState<string | null>(null);

    // Exclude already-applied from options
    const availableOptions = useMemo<IDiscountMaster[]>(() => {
        const appliedIds = new Set(appliedDiscounts.map(d => d.discountId));
        return discountList.filter(d => !appliedIds.has(d.id));
    }, [discountList, appliedDiscounts]);

    const totalDiscount = appliedDiscounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

    // ── SearchableSelect onChange ─────────────────────────────────────────────
    const handleSelectChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setSelectedDiscountId(e.target.value as string);
        setError(null);
    };

    // ── Apply ─────────────────────────────────────────────────────────────────
    
const handleApply = () => {
    if (!selectedDiscountId) return;
    const master = discountList.find(d => d.id === selectedDiscountId);
    if (!master) return;
 
    const err = validateDiscount(master, invoiceBase, appliedDiscounts);
    if (err) { setError(err); return; }
 
    // ✅ pass appliedDiscounts so the amount is capped at remaining balance
    onApply(buildInvoiceDiscount(master, invoiceBase, appliedDiscounts));
    setSelectedDiscountId("");
    setError(null);
};
 

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mt-3">

            {/* ── Section header ───────────────────────────────────────────── */}
            <div
                className="d-flex align-items-center justify-content-between px-3 py-2"
                style={{
                    background  : "rgba(var(--bs-success-rgb), 0.06)",
                    border      : "0.5px solid rgba(var(--bs-success-rgb), 0.25)",
                    borderBottom: "none",
                    borderRadius: "8px 8px 0 0",
                }}
            >
                <div className="d-flex align-items-center gap-2">
                    <Icon icon="LocalOffer" size="sm" color="success" />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--bs-success)" }}>
                        DISCOUNTS
                    </span>
                    {appliedDiscounts.length > 0 && (
                        <Badge isLight color="success" className="px-2 py-1" style={{ fontSize: 11 }}>
                            {appliedDiscounts.length} applied
                        </Badge>
                    )}
                </div>
                {totalDiscount > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--bs-success)" }}>
                        −{priceFormat(totalDiscount)}
                    </span>
                )}
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div
                className="p-3"
                style={{
                    border      : "0.5px solid rgba(var(--bs-success-rgb), 0.25)",
                    borderTop   : "none",
                    borderRadius: "0 0 8px 8px",
                    background  : "rgba(var(--bs-success-rgb), 0.02)",
                }}
            >
                {isLoading ? (
                    <div className="d-flex align-items-center gap-2">
                        <Spinner isSmall />
                        <span className="text-muted" style={{ fontSize: 12 }}>Loading discounts…</span>
                    </div>

                ) : availableOptions.length > 0 ? (
                    <>
                        {/* ── SearchableSelect + Apply ───────────────────── */}
                        <div className="d-flex align-items-start gap-2" style={{ maxWidth: 540 }}>
                            <div style={{ flex: 1 }}>
                                <SearchableSelect<IDiscountMaster>
                                    options={availableOptions}
                                    value={selectedDiscountId}
                                    onChange={handleSelectChange}
                                    valueKey="id"
                                    labelKey="name"                  // drives search matching
                                    renderLabel={renderDiscountOption} // rich two-row display
                                    placeholder="Search discount by code or name…"
                                    isTouched={!!error}
                                    isValid={!error}
                                    invalidFeedback={error ?? ""}
                                    isLoading={isLoading}
                                />
                            </div>
                            <Button
                                isLight
                                color="success"
                                onClick={handleApply}
                                isDisable={!selectedDiscountId}
                                style={{ flexShrink: 0, marginTop: 1 }}
                            >
                                Apply
                            </Button>
                        </div>

                        {/* ── Validation error ──────────────────────────── */}
                        {error && (
                            <div
                                className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded"
                                style={{
                                    fontSize  : 12,
                                    color     : "var(--bs-danger)",
                                    background: "rgba(var(--bs-danger-rgb), .08)",
                                    border    : "0.5px solid rgba(var(--bs-danger-rgb), .3)",
                                }}
                            >
                                <Icon icon="ErrorOutline" size="sm" />
                                <span className="flex-grow-1">{error}</span>
                                <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    style={{ color: "var(--bs-danger)", lineHeight: 1 }}
                                    onClick={() => setError(null)}
                                    tabIndex={-1}
                                >
                                    <Icon icon="Close" size="sm" />
                                </button>
                            </div>
                        )}

                        {/* ── Empty hint ────────────────────────────────── */}
                        {appliedDiscounts.length === 0 && !error && (
                            <p className="text-muted mt-2 mb-0" style={{ fontSize: 12, fontStyle: "italic" }}>
                                No discounts applied yet — select one above and click Apply.
                            </p>
                        )}
                    </>

                ) : (
                    <p className="text-muted mb-0" style={{ fontSize: 12, fontStyle: "italic" }}>
                        {appliedDiscounts.length > 0
                            ? "All available discounts have been applied."
                            : "No discounts available for this invoice."}
                    </p>
                )}

                {/* ── Applied discount chips ────────────────────────────────── */}
                {appliedDiscounts.length > 0 && (
                    <div className="d-flex flex-column gap-2 mt-3">
                        {appliedDiscounts.map(d => (
                            <div
                                key={d.discountId}
                                className="d-flex align-items-center justify-content-between px-3 py-2 rounded"
                                style={{
                                    background: "rgba(var(--bs-success-rgb), .08)",
                                    border    : "0.5px solid rgba(var(--bs-success-rgb), .3)",
                                }}
                            >
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <Icon icon="LocalOffer" size="sm" color="success" />
                                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--bs-success)" }}>
                                        {d.code}
                                    </span>
                                    <span className="text-muted" style={{ fontSize: 12 }}>
                                        {d.name}
                                    </span>
                                    <Badge
                                        isLight
                                        color={+d.type === DISCOUNT_TYPE.PERCENTAGE ? "info" : "success"}
                                        className="px-2 py-1"
                                        style={{ fontSize: 11 }}
                                    >
                                        {getAppliedDiscountLabel(d)}
                                    </Badge>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--bs-success)" }}>
                                        −{priceFormat(d.amount)}
                                    </span>
                                    <Button
                                        isLight
                                        color="danger"
                                        icon="Delete"
                                        size="sm"
                                        onClick={() => onRemove(d.discountId)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};