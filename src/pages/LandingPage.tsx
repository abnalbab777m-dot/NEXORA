import React from "react";
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { CheckCircle2, Coins, Target, Zap, Shield, Star, UserPlus } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            المنصة العربية الأفضل <br />
            <span className="text-yellow-500">للمهام والمكافآت</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            أنجز مهام بسيطة، شاهد الإعلانات، واربح مكافآت يومية بالدولار الأمريكي. انضم الآن وابدأ رحلتك مع Nexora.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto px-12">
                ابدأ الآن مجاناً
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-12">
                تسجيل الدخول
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-neutral-900 border-y border-neutral-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">كيف يعمل Nexora؟</h2>
            <p className="text-neutral-400">خطوات بسيطة تفصلك عن أرباحك اليومية</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<UserPlus className="w-8 h-8 text-yellow-500" />}
              title="1. أنشئ حسابك"
              description="تسجيل سريع وآمن للبدء في تحقيق الأرباح."
            />
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-yellow-500" />}
              title="2. أنجز المهام"
              description="مهام يومية ومشاهدة إعلانات تضاف لحسابك فوراً."
            />
            <FeatureCard 
              icon={<Coins className="w-8 h-8 text-yellow-500" />}
              title="3. اسحب أرباحك"
              description="سحب سريع وآمن عبر USDT وطرق دفع متعددة."
            />
          </div>
        </div>
      </section>
      
      {/* VIP Section Preview */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 text-center">
          <Star className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">نظام VIP المتقدم</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-10">
            ارتق بمستواك وضعف أرباحك مع باقات VIP المميزة التي تمنحك مهام أكثر وعوائد أعلى يومياً.
          </p>
          <Link to="/register">
            <Button variant="outline">استكشف الباقات</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 text-center hover:border-yellow-500/30 transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
