
const BASE_URL = 'https://api.telegram.org/bot';

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: any;
  callback_query?: any;
}

export const telegramService = {
  async getMe(token: string) {
    try {
      const res = await fetch(`${BASE_URL}${token}/getMe`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async getWebhookInfo(token: string) {
    try {
      const res = await fetch(`${BASE_URL}${token}/getWebhookInfo`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async setWebhook(token: string, url: string) {
    try {
      const res = await fetch(`${BASE_URL}${token}/setWebhook?url=${url}`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async deleteWebhook(token: string) {
    try {
      const res = await fetch(`${BASE_URL}${token}/deleteWebhook`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async sendMessage(token: string, chatId: number | string, text: string, replyMarkup?: any, options?: any) {
    try {
      const res = await fetch(`${BASE_URL}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: replyMarkup,
          parse_mode: 'HTML',
          ...options
        })
      });
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  // NEW: Forward Message (Preserves sender info, increases view count)
  async forwardMessage(token: string, chatId: number | string, fromChatId: number | string, messageId: number, options?: any) {
      try {
          const res = await fetch(`${BASE_URL}${token}/forwardMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: chatId,
                  from_chat_id: fromChatId,
                  message_id: messageId,
                  ...options
              })
          });
          return await res.json();
      } catch (e) {
          return { ok: false, description: 'Network Error' };
      }
  },

  async sendPhoto(token: string, chatId: number | string, photo: string | File, caption?: string, replyMarkup?: any, options?: any) {
      if (photo instanceof File) {
          const formData = new FormData();
          formData.append('chat_id', String(chatId));
          formData.append('photo', photo);
          if (caption) formData.append('caption', caption);
          if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));
          formData.append('parse_mode', 'HTML');
          if (options) {
              Object.keys(options).forEach(key => formData.append(key, options[key]));
          }
          const res = await fetch(`${BASE_URL}${token}/sendPhoto`, { method: 'POST', body: formData });
          return await res.json();
      } else {
          const res = await fetch(`${BASE_URL}${token}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: chatId,
                  photo,
                  caption,
                  reply_markup: replyMarkup,
                  parse_mode: 'HTML',
                  ...options
              })
          });
          return await res.json();
      }
  },
  
  async sendVideo(token: string, chatId: number | string, video: string | File, caption?: string, replyMarkup?: any, options?: any) {
      if (video instanceof File) {
          const formData = new FormData();
          formData.append('chat_id', String(chatId));
          formData.append('video', video);
          if (caption) formData.append('caption', caption);
          if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));
          formData.append('parse_mode', 'HTML');
          if (options) {
              Object.keys(options).forEach(key => formData.append(key, options[key]));
          }
          const res = await fetch(`${BASE_URL}${token}/sendVideo`, { method: 'POST', body: formData });
          return await res.json();
      } else {
          const res = await fetch(`${BASE_URL}${token}/sendVideo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: chatId,
                  video,
                  caption,
                  reply_markup: replyMarkup,
                  parse_mode: 'HTML',
                  ...options
              })
          });
          return await res.json();
      }
  },

  async sendDocument(token: string, chatId: number | string, document: string | File, caption?: string, replyMarkup?: any, options?: any) {
      if (document instanceof File) {
          const formData = new FormData();
          formData.append('chat_id', String(chatId));
          formData.append('document', document);
          if (caption) formData.append('caption', caption);
          if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));
          formData.append('parse_mode', 'HTML');
          if (options) {
              Object.keys(options).forEach(key => formData.append(key, options[key]));
          }
          const res = await fetch(`${BASE_URL}${token}/sendDocument`, { method: 'POST', body: formData });
          return await res.json();
      } else {
          const res = await fetch(`${BASE_URL}${token}/sendDocument`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: chatId,
                  document,
                  caption,
                  reply_markup: replyMarkup,
                  parse_mode: 'HTML',
                  ...options
              })
          });
          return await res.json();
      }
  },

  async sendMediaGroup(token: string, chatId: number | string, media: any[], caption?: string, options?: any) {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      
      const mediaArray = media.map((m, i) => {
          let mediaRef = m.media || m.file; 
          if (mediaRef instanceof File) {
              const attachName = `file${i}`;
              formData.append(attachName, mediaRef);
              mediaRef = `attach://${attachName}`;
          }
          return {
              type: m.type,
              media: mediaRef,
              caption: i === 0 ? (caption || m.caption) : '',
              parse_mode: 'HTML'
          };
      });

      formData.append('media', JSON.stringify(mediaArray));
      if (options) {
          Object.keys(options).forEach(key => formData.append(key, options[key]));
      }

      try {
        const res = await fetch(`${BASE_URL}${token}/sendMediaGroup`, {
            method: 'POST',
            body: formData
        });
        return await res.json();
      } catch (e) {
        return { ok: false, description: 'Network Error' };
      }
  },

  async pinChatMessage(token: string, chatId: number | string, messageId: number, disableNotification: boolean = false) {
    try {
      const res = await fetch(`${BASE_URL}${token}/pinChatMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          disable_notification: disableNotification
        })
      });
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async getChat(token: string, chatId: number | string) {
    try {
      const res = await fetch(`${BASE_URL}${token}/getChat?chat_id=${chatId}`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async getChatMember(token: string, chatId: number | string, userId: number) {
    try {
      const res = await fetch(`${BASE_URL}${token}/getChatMember?chat_id=${chatId}&user_id=${userId}`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async setMyCommands(token: string, commands: any[]) {
      try {
        const res = await fetch(`${BASE_URL}${token}/setMyCommands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });
        return await res.json();
      } catch (e) {
        return { ok: false, description: 'Network Error' };
      }
  },

  async getUpdates(token: string, offset: number, timeout: number = 10) {
    try {
      const res = await fetch(`${BASE_URL}${token}/getUpdates?offset=${offset}&timeout=${timeout}`);
      return await res.json();
    } catch (e) {
      return { ok: false, description: 'Network Error' };
    }
  },

  async copyMessage(token: string, chatId: number | string, fromChatId: number | string, messageId: number, caption?: string) {
    try {
        const payload: any = {
            chat_id: chatId,
            from_chat_id: fromChatId,
            message_id: messageId,
            parse_mode: 'HTML'
        };
        if (caption) payload.caption = caption;

        const res = await fetch(`${BASE_URL}${token}/copyMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (e) {
        return { ok: false, description: 'Network Error' };
    }
  },

  async answerCallbackQuery(token: string, callbackQueryId: string, text?: string, showAlert: boolean = false) {
    try {
        const res = await fetch(`${BASE_URL}${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                show_alert: showAlert
            })
        });
        return await res.json();
    } catch (e) {
        return { ok: false, description: 'Network Error' };
    }
  },

  async editMessageReplyMarkup(token: string, chatId: number | string, messageId: number, replyMarkup: any) {
      try {
          const res = await fetch(`${BASE_URL}${token}/editMessageReplyMarkup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  reply_markup: replyMarkup
              })
          });
          return await res.json();
      } catch (e) {
          return { ok: false, description: 'Network Error' };
      }
  },
  
  async uploadToDb(token: string, channelId: string, file: File, type: 'image' | 'video' | 'audio' | 'document'): Promise<string | null> {
      let res;
      if (type === 'image') res = await this.sendPhoto(token, channelId, file);
      else if (type === 'video') res = await this.sendVideo(token, channelId, file);
      else if (type === 'audio') res = await this.sendDocument(token, channelId, file); 
      else res = await this.sendDocument(token, channelId, file);

      if (res && res.ok && res.result) {
          if (type === 'image' && res.result.photo) return res.result.photo[res.result.photo.length - 1].file_id;
          if (type === 'video' && res.result.video) return res.result.video.file_id;
          if (type === 'audio' && res.result.audio) return res.result.audio.file_id;
          if (res.result.document) return res.result.document.file_id;
      }
      return null;
  },

  async sendPoll(token: string, chatId: number | string, question: string, options: string[], isAnonymous: boolean = true, allowsMultipleAnswers: boolean = false, type: 'regular' | 'quiz' = 'regular', correctOptionId?: number, explanation?: string) {
      try {
          const payload: any = {
              chat_id: chatId,
              question: question,
              options: options,
              is_anonymous: isAnonymous,
              type: type
          };

          if (type === 'regular') {
              payload.allows_multiple_answers = allowsMultipleAnswers;
          } else {
              if (correctOptionId !== undefined) payload.correct_option_id = correctOptionId;
              if (explanation) payload.explanation = explanation;
          }

          const response = await fetch(`${BASE_URL}${token}/sendPoll`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          return await response.json();
      } catch (error) {
          return { ok: false, description: 'Network Error' };
      }
  }
};
