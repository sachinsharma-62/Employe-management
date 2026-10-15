import { CalendarDays, Infinity as InfinityIcon, RefreshCw, Wallet } from 'lucide-react';

export default function LeaveBalanceGrid({ balances = [] }) {
  if (!balances.length) {
    return (
      <div className="leave-empty">
        <CalendarDays size={24} />
        <strong>No leave types assigned</strong>
        <small>Leave types applicable to you will appear here.</small>
      </div>
    );
  }

  return (
    <div className="leave-balance-grid">
      {balances.map((balance) => {
        const pct =
          !balance.unlimited && balance.entitlement > 0
            ? Math.min(Math.round((balance.used / balance.entitlement) * 100), 100)
            : 0;
        return (
          <div className={`leave-balance leave-balance--${balance.color || 'indigo'}`} key={balance.type}>
            <div className="leave-balance__head">
              <strong>{balance.name || balance.type}</strong>
              {balance.unlimited ? (
                <span className="leave-balance__value leave-balance__value--muted">
                  <InfinityIcon size={16} />
                </span>
              ) : (
                <span>
                  {balance.available}
                  <small> left</small>
                </span>
              )}
            </div>

            {!balance.unlimited && (
              <div className="leave-balance__track">
                <span style={{ width: `${pct}%` }} />
              </div>
            )}

            <div className="leave-balance__meta">
              {balance.unlimited ? (
                <small className="text-muted">No yearly limit</small>
              ) : (
                <small className="text-muted">
                  {balance.used} used · {balance.pending} pending · {balance.entitlement} entitled
                </small>
              )}
            </div>

            {(balance.carried > 0 || balance.carryForward || balance.encashable) && (
              <div className="leave-balance__tags">
                {balance.carried > 0 && (
                  <span className="leave-tag leave-tag--carry">
                    <RefreshCw size={11} /> {balance.carried} carried
                  </span>
                )}
                {balance.carryForward && balance.carried === 0 && (
                  <span className="leave-tag">
                    <RefreshCw size={11} /> Carry forward
                  </span>
                )}
                {balance.encashable && (
                  <span className="leave-tag leave-tag--cash">
                    <Wallet size={11} /> Encashable
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
