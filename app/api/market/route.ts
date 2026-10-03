import { NextResponse } from "next";
import { analyze, type Candle } from "@/lib/ta";

const SYMBOLS=["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT"];
const INTERVAL="1h";

export async function GET() {
  try {
    const results=await Promise.all(SYMBOLS.map(async symbol=>{
      const url=`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${INTERVAL}&limit=250`;
      const response=await fetch(url,{next:{revalidate:60}});
      if(!response.ok) throw new Error(`Binance ${response.status}`);
      const rows=await response.json() as unknown[][];
      const candles:Candle[]=rows.map(r=>({time:Number(r[0]),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])}));
      return {symbol, ...analyze(candles), updatedAt:candles.at(-1)?.time ?? Date.now()};
    }));
    return NextResponse.json({interval:INTERVAL,assets:results,source:"Binance public market data"});
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Market data unavailable"},{status:502});
  }
}
