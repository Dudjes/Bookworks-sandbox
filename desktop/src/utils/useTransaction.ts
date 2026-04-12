import { useState } from "react";
import { TransactionLineInput, TransactionHeaderInput } from "../../electron/database/transaction.js";

export function useTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = async (userId: number, data: TransactionHeaderInput) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:createTransaction", {
        userId,
        transactionData: data,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:getTransactions", userId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransaction = async (transactionId: number) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:getTransaction", transactionId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (transactionHeaderId: number, data: TransactionHeaderInput) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:updateTransaction", {
        transactionHeaderId,
        transactionData: data,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:deleteTransaction", transactionId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByPeriod = async (
    userId: number,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      return await window.api?.invoke("transaction:getTransactionsByPeriod", {
        userId,
        startDate,
        endDate,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByPeriod,
  };
}

// Export types for frontend use
export type { TransactionLineInput, TransactionHeaderInput };
