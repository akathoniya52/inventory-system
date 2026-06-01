import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import { extractError } from "@/api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@inventorypro.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-container-lowest text-on-surface">
      {/* Left: form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="absolute top-8 left-8 sm:top-12 sm:left-16 lg:left-24 xl:left-32 flex items-center gap-2">
          <Icon name="inventory_2" className="text-primary text-[28px]" filled />
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
            InventoryPro
          </span>
        </div>

        <div className="w-full max-w-md mx-auto mt-16 lg:mt-0">
          <div className="mb-10">
            <h1 className="font-display-sm text-display-sm text-on-surface mb-3">Welcome back</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please enter your details to access your dashboard.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@inventorypro.com"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md shadow-sm"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md shadow-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                <Icon name="error" className="text-[20px]" filled />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold shadow-sm hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading && <Spinner className="h-5 w-5" />}
              Sign in
            </button>
          </form>

          <p className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">
            Demo credentials are pre-filled — just click <span className="font-semibold">Sign in</span>.
          </p>
        </div>
      </div>

      {/* Right: illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container" />
        <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-outline-variant/30 overflow-hidden mx-8">
          <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/50">
                <Icon name="bar_chart" className="text-primary" filled />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Global Inventory Status
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Live metrics across 4 regions
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Live
            </span>
          </div>
          <div className="p-6 bg-surface-bright">
            <div className="flex justify-between items-end h-40 gap-3">
              {[40, 65, 95, 75, 35].map((h, i) => (
                <div key={i} className="w-full flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t-md ${i === 2 ? "bg-primary" : "bg-primary/30"}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 font-label-sm text-label-sm text-outline px-1">
              <span>NA</span>
              <span>EU</span>
              <span className="text-primary font-bold">APAC</span>
              <span>LATAM</span>
              <span>MEA</span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-outline-variant/30">
            <div className="p-4 border-r border-outline-variant/30">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Total Value</p>
              <p className="font-stats-number text-stats-number text-on-surface">$2.4M</p>
            </div>
            <div className="p-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                Fulfillment Rate
              </p>
              <p className="font-stats-number text-stats-number text-secondary">98.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
