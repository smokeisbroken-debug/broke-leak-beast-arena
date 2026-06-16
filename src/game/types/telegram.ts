export interface TelegramUserProfile {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface TelegramLaunchContext {
  isTelegram: boolean;
  user?: TelegramUserProfile;
  initData?: string;
}
