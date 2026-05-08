import { useEffect, useMemo, useRef, useState } from "react";
import { getStatementByResdientId } from "../../common/api/statement";
import { PRIMARY_ACCOUNT } from "../../common/constant";
import { useMasterData } from "../../contexts/mastersContext";

const EMPTY_STATEMENT = {
  transactions: [],
  summary: {
    current_due: 0,
    past_due_1_30: 0,
    past_due_31_60: 0,
    past_due_61_90: 0,
    past_due_90_plus: 0,
    total_due: 0,
    total_payed: 0,
    credit_wallet_used: 0,
    credit_wallet_added: 0,
    wallet_balance: 0,
    wallet_shared: { added: 0, used: 0, balance: 0, transactions: [] },
  },
};

export const useResidentStatement = (
  invoiceList: any[] = [],
  creditWallets: any[] = [],
  startDate: any,
  endDate: any
) => {
  const [statement, setStatement] = useState<any>(EMPTY_STATEMENT);
  const [loading, setLoading] = useState(false);

  const { bankList = [] } = useMasterData();

  const lastCallKey = useRef<string>("");
  const isMountedRef = useRef(true);

  const activeBankInfo = useMemo(() => {
    return bankList.find(
      ({ primaryAccount }: any) => primaryAccount === PRIMARY_ACCOUNT.YES
    );
  }, [bankList]);

  // ✅ Stable keys — only re-compute when IDs or dates actually change
  const invoiceKey = useMemo(
    () => invoiceList.map((i) => i.id).join(","),
    [invoiceList]
  );

  const walletKey = useMemo(
    () => creditWallets.map((w) => w.id).join(","),
    [creditWallets]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!activeBankInfo) return;

    // ✅ Return empty statement (not []) so component never breaks
    if (!invoiceList.length && !creditWallets?.length) {
      setStatement(EMPTY_STATEMENT);
      setLoading(false);
      return;
    }

    const callKey = `${invoiceKey}|${walletKey}|${startDate}|${endDate}|${activeBankInfo.id}`;

    // 🛑 Block duplicate calls
    if (lastCallKey.current === callKey) return;
    lastCallKey.current = callKey;

    setLoading(true);

    const load = async () => {
      try {
        const res = await getStatementByResdientId(
          invoiceList,
          creditWallets,
          activeBankInfo,
          startDate,
          endDate
        );

        if (isMountedRef.current) {
          setStatement(res ?? EMPTY_STATEMENT);
        }
      } catch (err) {
        console.error("Statement load error:", err);
        if (isMountedRef.current) {
          setStatement(EMPTY_STATEMENT);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    load();

    return () => {
      isMountedRef.current = false;
    };

    // ✅ Use stable string keys — NOT the array references directly
  }, [invoiceKey, walletKey, startDate, endDate, activeBankInfo]);

  return { statement, loading };
};