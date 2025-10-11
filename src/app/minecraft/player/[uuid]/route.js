import { NextResponse } from "next/server";
import DBService from "@/data/rest.db.js";

export async function GET(request, { params }) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== "xA3m29Nf8kRpV5u7TzGh1JwQyL0c") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  const { uuid } = params;
  
  try {
    // Find player by UUID using DBService
    const player = await DBService.readBy("uuid", uuid, "players");
    
    if (!player) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      uuid: player.uuid, 
      name: player.name, 
      coins: player.coins || 0 
    });
    
  } catch (error) {
    console.error("Error fetching player data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}