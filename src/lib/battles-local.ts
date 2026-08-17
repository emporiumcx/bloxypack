import { BATTLES, type Battle } from "./catalog";

const KEY = "rostake-battles";

export function loadLocalBattles(): Battle[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Battle[];
  } catch {
    return [];
  }
}

export function saveLocalBattle(battle: Battle) {
  const all = loadLocalBattles().filter((b) => b.id !== battle.id);
  localStorage.setItem(KEY, JSON.stringify([battle, ...all]));
}

export function findBattle(id: string): Battle | undefined {
  return loadLocalBattles().find((b) => b.id === id) ?? BATTLES.find((b) => b.id === id);
}
