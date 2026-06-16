import type { UpgradeId } from "../types/economy";

export class UpgradeSystem {
  private owned = new Set<UpgradeId>();

  unlock(upgrade: UpgradeId): void {
    this.owned.add(upgrade);
  }

  has(upgrade: UpgradeId): boolean {
    return this.owned.has(upgrade);
  }
}
