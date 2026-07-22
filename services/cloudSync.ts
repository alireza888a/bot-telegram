export const saveToCloud = async (code: string): Promise<boolean> => {
  try {
    if (!code) return false;
    
    const backupData = {
      meta: {
        version: "2.5.3",
        exported_at: new Date().toISOString(),
        type: "full_backup"
      },
      config: {
        token: localStorage.getItem('bot_token'),
        db_channel: localStorage.getItem('bot_db_channel'),
        webhook_url: localStorage.getItem('bot_webhook_url'),
        theme: localStorage.getItem('theme'),
        force_join: localStorage.getItem('force_join_enabled'),
        payment_card_number: localStorage.getItem('payment_card_number'),
        payment_card_owner: localStorage.getItem('payment_card_owner'),
        admin_chat_id: localStorage.getItem('admin_chat_id')
      },
      data: {
        menus: JSON.parse(localStorage.getItem('kb_menus') || '{}'),
        forms: JSON.parse(localStorage.getItem('kb_forms') || '{}'),
        commands: JSON.parse(localStorage.getItem('bot_commands') || '[]'),
        channels: JSON.parse(localStorage.getItem('saved_channels') || '[]'),
        templates: JSON.parse(localStorage.getItem('broadcast_templates') || '[]'),
        users: JSON.parse(localStorage.getItem('bot_users') || '[]'),
        logs: JSON.parse(localStorage.getItem('bot_logs') || '[]'),
        queue: JSON.parse(localStorage.getItem('channel_queue') || '[]'),
        products: JSON.parse(localStorage.getItem('bot_products') || '[]'),
        carts: JSON.parse(localStorage.getItem('bot_carts') || '{}'),
        orders: JSON.parse(localStorage.getItem('bot_orders') || '[]')
      }
    };

    const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/data/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, data: backupData })
    });
    
    const result = await res.json();
    return !!result.ok;
  } catch (e) {
    console.warn('Failed to save state to cloud:', e);
    return false;
  }
};

export const loadFromCloud = async (code: string): Promise<boolean> => {
  try {
    if (!code) return false;

    const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/data/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    const result = await res.json();
    if (result.ok && result.data) {
      const json = result.data;

      // Restore Config
      if (json.config) {
        if (json.config.token) localStorage.setItem('bot_token', json.config.token);
        if (json.config.db_channel) localStorage.setItem('bot_db_channel', json.config.db_channel);
        if (json.config.webhook_url) localStorage.setItem('bot_webhook_url', json.config.webhook_url);
        if (json.config.force_join) localStorage.setItem('force_join_enabled', json.config.force_join);
        if (json.config.payment_card_number) localStorage.setItem('payment_card_number', json.config.payment_card_number);
        if (json.config.payment_card_owner) localStorage.setItem('payment_card_owner', json.config.payment_card_owner);
        if (json.config.admin_chat_id) localStorage.setItem('admin_chat_id', json.config.admin_chat_id);
      }

      // Restore Data
      if (json.data) {
        localStorage.setItem('kb_menus', JSON.stringify(json.data.menus || {}));
        localStorage.setItem('kb_forms', JSON.stringify(json.data.forms || {}));
        localStorage.setItem('bot_commands', JSON.stringify(json.data.commands || []));
        localStorage.setItem('saved_channels', JSON.stringify(json.data.channels || []));
        localStorage.setItem('broadcast_templates', JSON.stringify(json.data.templates || []));
        localStorage.setItem('bot_users', JSON.stringify(json.data.users || []));
        localStorage.setItem('bot_logs', JSON.stringify(json.data.logs || []));
        localStorage.setItem('channel_queue', JSON.stringify(json.data.queue || []));
        localStorage.setItem('bot_products', JSON.stringify(json.data.products || []));
        localStorage.setItem('bot_carts', JSON.stringify(json.data.carts || {}));
        localStorage.setItem('bot_orders', JSON.stringify(json.data.orders || []));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Failed to load state from cloud:', e);
    return false;
  }
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export const syncNow = () => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
      const licenseCache = JSON.parse(licenseCacheStr);
      const code = licenseCache.code;
      if (code) {
        saveToCloud(code);
      }
    } catch (e) {
      // silent fail
    }
  }, 400);
};
