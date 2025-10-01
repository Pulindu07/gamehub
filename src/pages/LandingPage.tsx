import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useInvite } from "../hooks/useInvite";

const games = [
  { key: "tic-tac-toe", title: "Tic Tac Toe", desc: "Classic 3x3 X vs O" },
  {
    key: "memory-race",
    title: "Memory Race (Number Flip Duel)",
    desc: "Flip cards and remember numbers",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { createInvite, shareWhatsApp } = useInvite();

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">PlayTogether</h1>
        <p className="text-slate-600">
          Choose a game and invite a friend — instant invite link, share via
          WhatsApp.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {games.map((g) => (
          <Card key={g.key} title={g.title} subtitle={g.desc}>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => navigate(`/game/${g.key}`)}>
                Play solo / local
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const invite = createInvite(g.key);
                  shareWhatsApp(invite.url);
                }}
              >
                Invite & Share
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
