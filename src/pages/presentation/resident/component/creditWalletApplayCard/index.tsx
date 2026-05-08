import React, { useRef, useMemo } from "react";
import {
    Accordion,
    AccordionItem,
    Badge,
    Button,
    CardHeader,
    CardLabel,
    CardSubTitle,
    CardTitle,
    Input,
    InputGroup,
} from "../../../../../components/bootstrap";

import SimpleReactValidator from "simple-react-validator";
import { priceFormat, getLabelByValue } from "../../../../../helpers/helpers";
import {  INVOICE_TO_TYPE_LIST } from "../../../../../common/data/option";
import Icon from "../../../../../components/icon";

export interface CreditWalletCardProps {
    updatedWalletList: any[];
    applayWalletList: any[];
    invoiceTo?: number | null;

    onChange: (
        id: string,
        value: string,
        creditTo: number,
        code: string,
        fundTypeId: string
    ) => void;

    onApply: (id: string, code: string, creditTo: number, fundTypeId: string) => void;
}

export const CreditWalletApplayCard: React.FC<CreditWalletCardProps> = ({
    updatedWalletList = [],
    applayWalletList = [],
    invoiceTo,
    onChange,
    onApply,
}) => {

    const validator = useRef(
        new SimpleReactValidator({
            className: "text-danger",
        })
    );

    // Memoized map for fast lookup
    const appliedMap = useMemo(() => {
        const map: any = {};
        applayWalletList?.forEach((item) => (map[item.id] = item.amount));
        return map;
    }, [applayWalletList]);

    const renderWalletItem = (wallet: any, creditTo: number, fundTypeId: any) => {
        const { id, creditAmount, code, creditAmountUsed } = wallet;
        const fieldName = `Credit Wallet ${code}`;
        const appliedValue = appliedMap[id] || "";

        return (
            <div className="row align-items-center border-top py-3" key={id}>
                {/* LEFT SIDE */}
                <div className="col-6">
                    <CardHeader className="p-0">
                        <CardLabel>
                            <CardTitle className="h5 fw-medium">{code}</CardTitle>
                            <CardSubTitle>
                                <span className="text-sm">Available</span>
                                <span className="fs-1_2rem text-success ms-1">
                                    {priceFormat(creditAmountUsed)}
                                </span>
                                <span className="ms-1 text-sm">
                                    of {priceFormat(creditAmount)}
                                </span>
                            </CardSubTitle>
                        </CardLabel>
                    </CardHeader>
                </div>

                {/* RIGHT SIDE */}
                <div className="col-6">
                    <div className="d-flex flex-column">
                        <strong>Amount to Apply</strong>

                        <InputGroup className="mt-3">
                            <Input
                                type="number"
                                value={appliedValue}
                                className="form-control"
                                isValid={validator.current.fieldValid(fieldName)}
                                onChange={(e: any) =>
                                    onChange(id, e.target.value, creditTo, code, fundTypeId)
                                }
                                onBlur={() => validator.current.showMessageFor(fieldName)}
                                onFocus={() => validator.current.showMessageFor(fieldName)}
                            />

                            <Button
                                isLight
                                size="sm"
                                color="success"
                                isDisable={!validator.current.fieldValid(fieldName)}
                                onClick={() => {
                                    if (validator.current.allValid()) {
                                        onApply(id, code, creditTo, fundTypeId);
                                    } else {
                                        validator.current.showMessages();
                                    }
                                }}
                            >
                                Apply
                            </Button>
                        </InputGroup>

                        <span className="text-danger mt-1 d-inline-block">
                            {validator.current.message(
                                fieldName,
                                appliedValue,
                                `numeric|min:1,num|max:${creditAmountUsed},num`
                            )}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderWalletGroup = ({ creditTo, wallets, fundTypeId }: any) => {
        if (Number(invoiceTo) !== creditTo) return null;

        return (
            <div key={creditTo}>
                <Accordion
                    id={`accordion-${creditTo}`}
                    shadow="none"
                    className="border border-1 rounded-1"
                >
                    <AccordionItem
                        id={`accordion-item-${creditTo}`}
                        title={
                            <div className="d-flex justify-content-between w-100 align-items-center">
                                <div className="d-flex align-items-center">
                                    <Icon icon="CreditCard" color="info" className="h3" />
                                    <div className="ms-3">
                                        <div className="fw-medium fs-5">
                                            Available Credits ({wallets.length})
                                        </div>
                                    </div>
                                </div>

                                <Badge className="px-3 py-2 me-4" isLight color="dark">
                                    {getLabelByValue(INVOICE_TO_TYPE_LIST, creditTo)}
                                </Badge>
                            </div>
                        }
                    >
                        {wallets?.map((wallet: any) =>
                            renderWalletItem(wallet, creditTo, fundTypeId)
                        )}
                    </AccordionItem>
                </Accordion>
            </div>
        );
    };

    return <>{updatedWalletList?.map(renderWalletGroup)}</>;
};
