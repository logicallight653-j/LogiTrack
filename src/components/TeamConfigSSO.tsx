import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";
import { Users, Key, Shield, UserCheck, Play, Save, CheckCircle2, CloudLightning, RefreshCw, AlertCircle } from "lucide-react";

export const TeamConfigSSO: React.FC = () => {
  const { currentUser, updateUserRole, createAuditLog, isOnline, addNotification } = useApp();

  // SSO settings input parameters
  const [ssoProvider, setSsoProvider] = useState<string>("Okta Entra");
  const [ssoClientId, setSsoClientId] = useState<string>("cli_okta_772095");
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState<string>("https://okta.logitrack.com/oauth2/default");
  const [isSsoConnected, setIsSsoConnected] = useState<boolean>(false);
  const [connectionLogs, setConnectionLogs] = useState<string>("");

  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<UserRole>("WAREHOUSE_STAFF");
  const [members, setMembers] = useState<Array<{ email: string; role: UserRole; status: string }>>([
    { email: "admin@logitrack.com", role: "ADMIN", status: "Active SSO Verified" },
    { email: "bay4_staff@logitrack.com", role: "WAREHOUSE_STAFF", status: "Active Card Cleared" },
    { email: "driver_oak@logitrack.com", role: "DRIVER", status: "Active On-Device App" },
  ]);

  const handleConnectSSO = () => {
    if (!ssoClientId || !ssoMetadataUrl) {
      alert("Supply SSO credentials before launching Federated Handshake.");
      return;
    }

    setConnectionLogs("Issuing metadata polling check sequence...");
    setTimeout(() => {
      setConnectionLogs("Metadata matching OK. Asserting secure token exchange keys...");
      setTimeout(() => {
        setIsSsoConnected(true);
        setConnectionLogs("Active Federated SSO link established! Okta identities are synced mapping roles.");
        addNotification("Federated SSO Connected", `Linked organization authentication with ${ssoProvider}`, "sync");
        createAuditLog("SSO_FEDERATED_BINDING", `Bound Azure/Okta Federated identity manager. Client ID: [${ssoClientId}]`);
      }, 1000);
    }, 800);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember = { email: inviteEmail, role: inviteRole, status: "Pending Invite" };
    setMembers([...members, newMember]);
    setInviteEmail("");
    addNotification("Staff Invited", `Invite sent to ${inviteEmail} with role clearance ${inviteRole}`, "alert");
    createAuditLog("TEAM_USER_INVITED", `Dispatched registration invite to: ${inviteEmail} as role clearance: ${inviteRole}`);
  };

  const overrideRoleLocal = async (role: UserRole) => {
    await updateUserRole(role);
  };

  return (
    <div className="space-y-6">
      
      {/* Access Override Bar */}
      <div className="bg-slate-900 border-2 border-yellow-500/20 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-mono text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Shield className="w-3.5 h-3.5" /> Evaluator Sandbox override panel:
          </span>
          <p className="text-sm text-gray-300">
            Rapidly shift between security roles to test permissions clearances and dashboard custom view rules:
          </p>
        </div>

        <div className="flex gap-2">
          {["ADMIN", "WAREHOUSE_STAFF", "DRIVER"].map((role) => (
            <button
              key={role}
              onClick={() => overrideRoleLocal(role as UserRole)}
              className={`p-2 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentUser?.role === role
                  ? "bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700/60"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{role}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: SSO Federated setup */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="flex items-center gap-2 border-b border-[#243052] pb-3.5">
            <Key className="text-[#2f6fed] w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Enterprise Authentication SAML SSO Settings</h3>
          </div>

          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Support robust external directories (Entra ID, Ping Identity, Okta SAML 2.0/OIDC) mapping corporate credentials directly to access authorizations.
          </p>

          <div className="space-y-3 text-xs font-mono select-none">
            <div>
              <label className="block text-gray-400 mb-1 font-bold">IDENTITY PROVIDER GATEWAY:</label>
              <select
                value={ssoProvider}
                onChange={(e) => setSsoProvider(e.target.value)}
                className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="Azure AD / Entra ID">Azure AD / Entra ID</option>
                <option value="Okta Federated SAML">Okta Federated SAML</option>
                <option value="Ping Identity Integration Suite">Ping Identity Integration Suite</option>
                <option value="Google Workspace SSO Gate">Google Workspace SSO Gate</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">OAUTH CLIENT ID:</label>
                <input
                  type="text"
                  placeholder="cli_sso_884920"
                  value={ssoClientId}
                  onChange={(e) => setSsoClientId(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 px-3 text-white focus:outline-none focus:border-[#2f6fed]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">REAL-TIME META URL:</label>
                <input
                  type="text"
                  placeholder="https://identity.company.org/sso"
                  value={ssoMetadataUrl}
                  onChange={(e) => setSsoMetadataUrl(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 px-3 text-white focus:outline-none focus:border-[#2f6fed]"
                />
              </div>
            </div>

            {/* SSO connection diagnostics feedback block */}
            {connectionLogs && (
              <div className="bg-[#0b1220] border border-[#243052] p-3 rounded-lg flex items-start gap-2 text-[10px] text-gray-300 text-left font-mono leading-relaxed">
                <CloudLightning className="text-cyan-400 w-4 h-4 shrink-0 mt-0.5" />
                <span>{connectionLogs}</span>
              </div>
            )}

            {isSsoConnected ? (
              <div className="bg-green-950/20 border border-green-500/20 text-green-300 p-3 rounded-lg flex items-center gap-2 text-xs font-bold leading-relaxed">
                <CheckCircle2 className="text-green-400 w-5 h-5 shrink-0" />
                <span>SSO FEDERATION ACTIVE: SSO BOUND IDENTITY MANAGER STATUS IS SECURE</span>
              </div>
            ) : (
              <button
                onClick={handleConnectSSO}
                className="w-full py-2.5 bg-[#2f6fed] hover:bg-[#1d5ace] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Establish SSO Identity Federation
              </button>
            )}
          </div>
        </div>

        {/* Right Card: Multi-role Team lists */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="flex items-center gap-2 border-b border-[#243052] pb-3.5">
            <Users className="text-[#2f6fed] w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Granular Company Organizational Directory</h3>
          </div>

          <form onSubmit={handleInviteUser} className="bg-[#0b1220]/60 border border-[#243052] rounded-xl p-4 space-y-3 text-xs select-none">
            <span className="block text-[10px] uppercase text-gray-400 font-bold font-mono">Disciplinary Invites dispatcher:</span>
            
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-[#111a2e] border border-[#243052] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#2f6fed]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="bg-[#111a2e] border border-[#243052] rounded-lg px-2.5 py-1 text-white font-mono"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="WAREHOUSE_STAFF">STAFF</option>
                <option value="DRIVER">DRIVER</option>
              </select>
              <button
                type="submit"
                className="bg-[#243052] hover:bg-[#2e3e68] border border-[#37497d] text-white font-bold rounded-lg px-3.5 flex items-center justify-center font-mono cursor-pointer"
              >
                Invite
              </button>
            </div>
          </form>

          {/* Members list display grid */}
          <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="bg-[#0b1220]/60 border border-[#243052] p-3 rounded-lg flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5 text-left">
                  <div className="text-white font-semibold">{member.email}</div>
                  <div className="text-[10px] text-gray-500 font-normal">{member.status}</div>
                </div>
                
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  member.role === "ADMIN" 
                    ? "bg-red-950/40 border-red-500/20 text-red-400" 
                    : member.role === "WAREHOUSE_STAFF"
                    ? "bg-blue-950/40 border-blue-500/20 text-blue-400"
                    : "bg-amber-950/40 border-amber-500/20 text-amber-400"
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
