import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useInvite } from "../hooks/useInvite";

const games = [
  { 
    key: "tic-tac-toe", 
    title: "Tic Tac Toe", 
    desc: "Classic 3x3 X vs O strategy game",
    icon: "⭕",
    color: "from-blue-500 to-indigo-600"
  },
  {
    key: "memory-race",
    title: "Memory Race",
    desc: "Flip cards and remember numbers in this brain-training game",
    icon: "🧠",
    color: "from-purple-500 to-pink-600"
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  // const { createInvite, shareWhatsApp } = useInvite();

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <span className="hero-badge">🎮</span>
        <h1 className="hero-title">PlayTogether</h1>
        <p className="hero-sub">
          Choose a game and invite a friend — instant invite link, share via WhatsApp.
          <small>Play locally or connect with friends in real-time</small>
        </p>
      </div>

      {/* Games Grid */}
      <div className="container-lg">
        <div className="grid-1-2">
          {games.map((game) => (
            <Card key={game.key} title={game.title} subtitle={game.desc}>
              <div className="flex gap-3 mt-6" style={{flexWrap:'wrap'}}>
                <Button onClick={() => navigate(`/game/${game.key}`)} size="lg" className="flex-1">🎯 Play Solo</Button>
                {/* <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const invite = createInvite(game.key);
                    shareWhatsApp(invite.url);
                  }}
                  className="flex-1"
                >
                  📱 Invite & Share
                </Button> */}
              </div>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 center">
          <h2 className="card-title" style={{fontSize:22, marginBottom:16}}>Why PlayTogether?</h2>
          <div className="container-sm" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16}}>
            <div className="card">
              <div className="card-title" style={{fontSize:24, marginBottom:8}}>⚡</div>
              <h3 className="card-title" style={{fontSize:16}}>Instant Play</h3>
              <p className="card-sub">No downloads, no registration required</p>
            </div>
            <div className="card">
              <div className="card-title" style={{fontSize:24, marginBottom:8}}>🌐</div>
              <h3 className="card-title" style={{fontSize:16}}>Real-time</h3>
              <p className="card-sub">Play with friends anywhere in the world</p>
            </div>
            <div className="card">
              <div className="card-title" style={{fontSize:24, marginBottom:8}}>📱</div>
              <h3 className="card-title" style={{fontSize:16}}>Easy Sharing</h3>
              <p className="card-sub">One-click WhatsApp invites</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
