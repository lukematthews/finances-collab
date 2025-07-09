import { WS_URL } from "@/config";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BudgetWizard from "./BudgetWizard";
import { ProfileMenu } from "./ProfileMenu";

export default function HomePage() {
  const { budgetSummaries, loadBudgetSummaries } = useBudgetStore();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    loadBudgetSummaries();
  }, [loadBudgetSummaries]);

  const isLoggedIn = budgetSummaries.length > 0;

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex justify-end items-center px-6 py-4">
          <div className="flex items-center gap-x-4">
            <h2 className="text-2xl font-semibold text-gray-800">Simple Digits</h2>
            <ProfileMenu />
          </div>
        </div>
        <div className="flex-1 flex items-end justify-center pb-12">
          <h1 className="text-6xl font-serif font-bold text-gray-800 text-center">Your Budgets</h1>
        </div>

        {!isLoggedIn && (
          <div className="flex justify-center mb-6">
            <a href={`${WS_URL}/auth/google`} className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl shadow hover:bg-blue-700 transition">
              Sign in with Google
            </a>
          </div>
        )}

        {budgetSummaries.length === 0 && isLoggedIn && (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No budgets found.</p>
          </div>
        )}

        <div className="flex-1 flex items-start justify-center px-6">
          <div className="w-full max-w-5xl flex flex-wrap justify-center gap-8">
            {budgetSummaries.map((b) => (
              <div key={b.id} className="bg-blue-600 text-white rounded-2xl shadow-lg p-6 w-80 flex flex-col justify-between">
                <h2 className="text-2xl font-semibold mb-4">{b.name}</h2>
                <Link to={`/b/${b.shortCode}`} className="mt-auto px-4 py-2 bg-white text-blue-600 text-center font-medium rounded-xl hover:bg-blue-100 transition">
                  Open
                </Link>
              </div>
            ))}
          </div>
        </div>

        {!showWizard ? (
          <div className="text-center my-8">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition" onClick={() => setShowWizard(true)}>
              Create budget...
            </button>
          </div>
        ) : (
          <div className="mt-6 px-6">
            <BudgetWizard onCancel={() => setShowWizard(false)} />
          </div>
        )}
      </div>
    </>
  );
}
