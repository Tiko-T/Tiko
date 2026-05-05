import { StatusBadge } from "@/components/common/status-badge";
import { SiteHeader } from "@/components/layout/site-header";
import { CreateInviteForm } from "@/components/admin/create-invite-form";
import { RetryOrderButton } from "@/components/admin/retry-order-button";
import { requireAdminUser } from "@/lib/auth/page-guards";
import { listInvites } from "@/lib/auth/session";
import {
  formatDateTimeLabel,
  formatTokenAmount,
  shortenHash,
  titleFromScreamingSnake,
} from "@/lib/frontend/format";
import { listSupportOrders } from "@/lib/tiko/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const currentUser = await requireAdminUser("/admin");
  const [invites, orders] = await Promise.all([listInvites(), listSupportOrders()]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <section className="section-card rounded-[2.5rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow text-[color:var(--accent-strong)]">Admin</p>
            <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
              Private beta operations.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
              Signed in as {currentUser.displayName ?? currentUser.email}. Manage invites,
              monitor hosted orders, and requeue failed background work from one place.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="section-card rounded-[2rem] p-6 sm:p-8">
            <div className="space-y-2">
              <p className="eyebrow text-[color:var(--accent-strong)]">Invite beta users</p>
              <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                Create tester and operator access
              </h2>
            </div>
            <div className="mt-6">
              <CreateInviteForm />
            </div>
          </div>

          <div className="section-card rounded-[2rem] p-6 sm:p-8">
            <div className="space-y-2">
              <p className="eyebrow text-[color:var(--accent-strong)]">Recent invites</p>
              <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                Track invitation status
              </h2>
            </div>
            <div className="mt-6 space-y-4">
              {invites.length ? (
                invites.slice(0, 8).map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          {invite.email}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {titleFromScreamingSnake(invite.role)} invited by{" "}
                          {invite.invitedBy?.displayName ?? invite.invitedBy?.email ?? "system"}
                        </p>
                      </div>
                      <StatusBadge
                        label={invite.acceptedAt ? "Accepted" : "Pending"}
                        tone={invite.acceptedAt ? "success" : "warning"}
                      />
                    </div>
                    <p className="mt-3 text-sm text-[color:var(--muted)]">
                      Expires {formatDateTimeLabel(invite.expiresAt.toISOString())}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">No invites created yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="section-card rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="eyebrow text-[color:var(--accent-strong)]">Hosted orders</p>
            <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
              Monitor payment, minting, and retries
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            {orders.length ? (
              orders.map((order) => {
                const symbol = order.paymentIntent?.token.symbol ?? "token";
                const decimals = order.paymentIntent?.token.decimals ?? 0;

                return (
                  <article
                    key={order.id}
                    className="rounded-[1.7rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-semibold text-[color:var(--ink)]">
                            {order.reference}
                          </p>
                          <StatusBadge
                            label={titleFromScreamingSnake(order.status)}
                            tone={
                              order.status === "FULFILLED"
                                ? "success"
                                : order.status === "FAILED"
                                ? "danger"
                                : "accent"
                            }
                          />
                        </div>
                        <p className="text-sm text-[color:var(--muted)]">
                          {order.buyer.displayName ?? order.buyer.email} · {order.product.title}
                        </p>
                        <p className="text-sm text-[color:var(--muted)]">
                          {formatTokenAmount(order.paymentAmount, decimals, symbol)} ·{" "}
                          {order.paymentIntent?.status
                            ? titleFromScreamingSnake(order.paymentIntent.status)
                            : "No payment intent"}
                        </p>
                      </div>

                      <RetryOrderButton orderId={order.id} />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      <SupportStat
                        label="Submitted tx"
                        value={
                          order.paymentIntent?.submittedTxHash
                            ? shortenHash(order.paymentIntent.submittedTxHash)
                            : "None"
                        }
                      />
                      <SupportStat
                        label="Confirmed tx"
                        value={
                          order.paymentIntent?.confirmedTxHash
                            ? shortenHash(order.paymentIntent.confirmedTxHash)
                            : "None"
                        }
                      />
                      <SupportStat
                        label="Spore mint"
                        value={
                          order.sporeAsset
                            ? titleFromScreamingSnake(order.sporeAsset.mintStatus)
                            : "Not started"
                        }
                      />
                    </div>

                    {order.jobs.length ? (
                      <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {order.jobs.slice(0, 4).map((job) => (
                          <div
                            key={job.id}
                            className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[color:var(--ink)]">
                                {titleFromScreamingSnake(job.type)}
                              </p>
                              <StatusBadge
                                label={titleFromScreamingSnake(job.status)}
                                tone={
                                  job.status === "COMPLETED"
                                    ? "success"
                                    : job.status === "FAILED"
                                    ? "danger"
                                    : job.status === "RUNNING"
                                    ? "warning"
                                    : "accent"
                                }
                              />
                            </div>
                            <p className="mt-2 text-sm text-[color:var(--muted)]">
                              Attempts {job.attempts}
                            </p>
                            {job.failureReason ? (
                              <p className="mt-2 text-sm text-[color:var(--danger)]">
                                {job.failureReason}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-[color:var(--muted)]">No hosted orders yet.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function SupportStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p className="mt-3 break-all text-sm font-semibold text-[color:var(--ink)]">
        {props.value}
      </p>
    </div>
  );
}
