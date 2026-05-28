"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

// Utility to load Razorpay script dynamically
const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingPage() {
  const { user, userProfile } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const isTeacher = userProfile?.role === "teacher";

  const tiers = [
    {
      name: "Scholar",
      price: "$0",
      period: "forever",
      desc: "Perfect for individual students seeking personalized roadmaps.",
      features: [
        "Up to 3 active adaptive AI roadmaps",
        "Generates standard visual aids and flowcharts",
        "Full access to local study sessions",
        "10 daily AI tutoring chat credits",
        "Basic study metrics & tracking dashboard"
      ],
      cta: "Current Free Tier",
      active: !isTeacher,
      popular: false,
      isTeacherTier: false
    },
    {
      name: "Polymath",
      price: "$12",
      period: "per month",
      desc: "Unlock advanced memory systems and unlimited tutoring.",
      features: [
        "Unlimited active adaptive AI roadmaps",
        "Generates complex charts, math equations & graphs",
        "Unlimited real-time interactive AI tutoring",
        "Priority Pinecone RAG semantic indexing speeds",
        "Full progress analytics & custom SVG charts",
        "Early access to beta study modes"
      ],
      cta: "Upgrade to Polymath",
      active: false,
      popular: true,
      isTeacherTier: false
    },
    {
      name: "Guild Master",
      price: "$49",
      period: "per month",
      desc: "For class squads, study circles, and peer guilds.",
      features: [
        "Everything included in Polymath plan",
        "Invite up to 10 active study squad members",
        "Collaborative syllabus generation options",
        "Shared vector indexing databases",
        "Aggregated instructor stats dashboard link",
        "Dedicated cloud database sync intervals"
      ],
      cta: isTeacher ? "Current Plan" : "Upgrade to Educator",
      active: isTeacher,
      popular: false,
      isTeacherTier: true
    }
  ];

  async function handleUpgrade(tier: any) {
    if (!user) return alert("Please log in first.");
    
    // Polymath or Guild Master
    if (tier.name !== "Scholar") {
      setUpgrading(true);
      
      const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setUpgrading(false);
        return;
      }

      try {
        // Parse price from string (e.g. "$49" -> 49)
        const priceNum = parseInt(tier.price.replace(/[^0-9]/g, ''));
        
        // 1. Create order on our backend
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: priceNum, currency: "INR" }) // using INR for test accounts usually
        });
        const orderData = await orderRes.json();

        if (!orderData.success) {
          throw new Error("Failed to create order");
        }

        // 2. Open Razorpay Checkout Modal
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Arise AI",
          description: `Subscription to ${tier.name} Plan`,
          order_id: orderData.order.id,
          handler: async function (response: any) {
            try {
              // 3. Verify Payment Signature
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              });
              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                // 4. Payment Verified! Upgrade the user account!
                const userRef = doc(db, "users", user.uid);
                // If it's Guild Master, they are a teacher. Otherwise just normal premium student.
                const newRole = tier.isTeacherTier ? "teacher" : "student";
                
                await updateDoc(userRef, { 
                  role: newRole,
                  tier: tier.name.toLowerCase()
                });
                
                alert(`Success! Welcome to the ${tier.name} tier!`);
                window.location.reload();
              } else {
                alert("Payment verification failed.");
              }
            } catch (err) {
              console.error("Verification error:", err);
              alert("Payment verification error.");
            } finally {
              setUpgrading(false);
            }
          },
          prefill: {
            name: user.displayName || "Student",
            email: user.email || "",
          },
          theme: {
            color: "#c5a880", // using primary color
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on("payment.failed", function (response: any) {
          alert("Payment failed or cancelled.");
          setUpgrading(false);
        });
        paymentObject.open();

      } catch (error) {
        console.error("Razorpay error:", error);
        alert("Failed to initiate payment.");
        setUpgrading(false);
      }
    } else {
      alert("You are already on the Free tier.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center justify-center gap-3">
          <CreditCard className="text-primary w-6 h-6" />
          Subscription Plans & Pricing
        </h1>
        <p className="text-muted-foreground text-xs leading-normal">
          Accelerate your retention speed. Upgrade to premium tiers to unlock unlimited personalized roadmaps, high-fidelity AI tutoring, and complex visualizers.
        </p>
      </div>

      {/* Pricing Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        {tiers.map((tier) => (
          <Card 
            key={tier.name}
            className={`p-6 border rounded-lg bg-card relative overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] ${
              tier.popular 
                ? "border-primary shadow-[0_4px_25px_rgba(197,168,128,0.08)] bg-card/85" 
                : "border-border hover:border-primary/55"
            }`}
          >
            {tier.popular && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded text-[8px] font-mono tracking-widest text-primary font-bold uppercase select-none">
                <Sparkles className="w-2.5 h-2.5" /> POPULAR Choice
              </div>
            )}

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest font-bold text-primary uppercase">{tier.name}</span>
                <div className="flex items-baseline gap-1 mt-2.5">
                  <span className="text-3xl font-bold text-foreground tracking-tighter">{tier.price}</span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">/ {tier.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{tier.desc}</p>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-border/40">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Button 
                onClick={() => handleUpgrade(tier)}
                disabled={tier.active || upgrading}
                className={`w-full h-11 text-xs font-mono uppercase tracking-widest rounded-md transition-all cursor-pointer ${
                  tier.active 
                    ? "bg-secondary/15 border border-border text-muted-foreground cursor-not-allowed" 
                    : tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80"
                      : "bg-card border border-border hover:bg-secondary/15 text-foreground"
                }`}
              >
                {upgrading && tier.name !== "Scholar" ? "Processing..." : tier.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
