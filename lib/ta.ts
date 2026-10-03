export type Candle = { time:number; open:number; high:number; low:number; close:number; volume:number };

export function ema(values:number[], period:number) {
  if (!values.length) return 0;
  const k = 2 / (period + 1);
  let value = values[0];
  for (let i=1;i<values.length;i++) value = values[i] * k + value * (1-k);
  return value;
}

export function rsi(values:number[], period=14) {
  if (values.length <= period) return 50;
  let gains=0, losses=0;
  for (let i=1;i<=period;i++) { const d=values[i]-values[i-1]; if(d>=0) gains+=d; else losses-=d; }
  let avgGain=gains/period, avgLoss=losses/period;
  for(let i=period+1;i<values.length;i++) { const d=values[i]-values[i-1]; const gain=Math.max(d,0); const loss=Math.max(-d,0); avgGain=(avgGain*(period-1)+gain)/period; avgLoss=(avgLoss*(period-1)+loss)/period; }
  if(avgLoss===0) return 100;
  return 100 - 100/(1+avgGain/avgLoss);
}

export function atr(candles:Candle[], period=14) {
  if(candles.length<2) return 0;
  const trs:number[]=[];
  for(let i=1;i<candles.length;i++) trs.push(Math.max(candles[i].high-candles[i-1].close, candles[i].high-candles[i].low, Math.abs(candles[i].low-candles[i-1].close)));
  const slice=trs.slice(-period);
  return slice.reduce((a,b)=>a+b,0)/(slice.length||1);
}

export function supportResistance(candles:Candle[], lookback=30) {
  const c=candles.slice(-lookback);
  return { support: Math.min(...c.map(x=>x.low)), resistance: Math.max(...c.map(x=>x.high)) };
}

export function analyze(candles:Candle[]) {
  const closes=candles.map(c=>c.close);
  const price=closes.at(-1) ?? 0;
  const e20=ema(closes,20), e50=ema(closes,50), e200=ema(closes,200);
  const r=rsi(closes), a=atr(candles), {support,resistance}=supportResistance(candles);
  let score=0; const reasons:string[]=[];
  if(price>e20){score++;reasons.push("Price is above EMA 20");}
  if(e20>e50){score++;reasons.push("EMA 20 is above EMA 50");}
  if(e50>e200){score++;reasons.push("EMA 50 is above EMA 200");}
  if(r>=50 && r<=70){score++;reasons.push("RSI supports bullish momentum without being overbought");}
  if(r>70){reasons.push("RSI is overbought; avoid chasing");}
  const recent=candles.slice(-5), earlier=candles.slice(-10,-5);
  const rv=recent.reduce((s,c)=>s+c.volume,0)/Math.max(recent.length,1), ev=earlier.reduce((s,c)=>s+c.volume,0)/Math.max(earlier.length,1);
  if(rv>ev){score++;reasons.push("Recent volume is increasing");}
  const trend=price>e20 && e20>e50 ? "bullish" : price<e20 && e20<e50 ? "bearish" : "mixed";
  const room=Math.max(resistance-price,0);
  const risk=Math.max(a*1.2, price*0.005);
  const stop=Math.max(price-risk,0);
  const target=Math.min(price+risk*2, resistance);
  const rr=target>price && price>stop ? (target-price)/(price-stop) : 0;
  const status=score>=4 && trend==="bullish" && rr>=1.5 ? "WATCH" : score>=3 ? "SETUP FORMING" : "WAIT";
  return {price,e20,e50,e200,rsi:r,atr:a,support,resistance,score,maxScore:5,trend,room,stop,target,rr,status,reasons};
}
