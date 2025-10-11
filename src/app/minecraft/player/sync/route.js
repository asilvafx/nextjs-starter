import { NextResponse } from "next/server";
import DBService from "@/data/rest.db.js";

export async function POST(request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== "xA3m29Nf8kRpV5u7TzGh1JwQyL0c") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.uuid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { uuid, name } = body;
  
  try {
    // Check if player already exists
    const existingPlayer = await DBService.readBy("uuid", uuid, "players");
    
    let player;
    if (existingPlayer) {
      // Update existing player if name is provided
      if (name) {
        const updateData = { ...existingPlayer, name };
        const updateResult = await DBService.update(existingPlayer.id || uuid, updateData, "players");
        player = updateResult.success ? updateData : existingPlayer;
      } else {
        player = existingPlayer;
      }
    } else {
      // Create new player
      const newPlayerData = {
        uuid,
        name: name || "Unknown",
        coins: 0,
        exp: 0,
        createdAt: new Date().toISOString()
      };
      const createResult = await DBService.create(newPlayerData, "players");
      player = createResult.success ? newPlayerData : null;
    }

    if (!player) {
      return NextResponse.json({ error: "Failed to sync player data" }, { status: 500 });
    }

    return NextResponse.json({ 
      uuid: player.uuid, 
      name: player.name, 
      coins: player.coins || 0, 
      exp: player.exp || 0 
    });
    
  } catch (error) {
    console.error("Error syncing player data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}