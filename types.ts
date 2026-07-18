
import React from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface Channel {
  id: number | string;
  name: string;
  members: number;
  role: 'creator' | 'admin';
  username: string;
  isLocked?: boolean; // New: For Force Join
}

export interface BotConfig {
  token: string;
  name: string;
  webhookUrl: string;
  isActive: boolean;
}

export type ButtonActionType = 'link' | 'submenu' | 'form' | 'command' | 'callback' | 'inquiry';

export interface InquiryConfig {
    adminId: string; // The admin who receives the lead
    catalogFileId?: string; // Telegram File ID of the PDF/Image
    catalogFileName?: string;
    catalogType?: 'image' | 'document';
    responseText: string; // What the bot says to the user (e.g. "Here is the catalog, message me")
}

export interface InlineButton {
  id: string;
  text: string;
  type: ButtonActionType;
  value?: string; // URL, Command, or Webview URL
  targetMenuId?: string; // ID of the submenu Page if type is 'submenu'
  inquiryConfig?: InquiryConfig; // NEW: For Inquiry/Lead Gen buttons
  color?: 'default' | 'blue' | 'green' | 'red' | 'gold' | 'orange'; // NEW: Colored inline buttons
}

export interface InlineRow {
  id: string;
  buttons: InlineButton[];
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string; // Used for File_ID if available, or Blob URL as fallback
  previewUrl?: string; // Always a Blob URL for displaying in the browser UI
  name: string;
  fileId?: string; // The Telegram File ID (Persistent)
}

export interface MenuPage {
  id: string;
  title: string; // Internal admin title
  content: string; // The message text
  media: MediaAttachment[];
  rows: InlineRow[];
  parentId?: string; // To navigate back
}

export interface FormQuestion {
    id: string;
    text: string;
    type: 'text' | 'number' | 'photo' | 'document';
}

export interface FormConfig {
    id: string;
    title: string;
    adminId: string;
    questions: FormQuestion[];
}

export interface CommandConfig {
    command: string; // e.g., "start" (no slash)
    description: string; // e.g., "شروع مجدد ربات"
    actionType: 'menu' | 'text' | 'function';
    actionValue: string; // MenuID, Text Content, or Function Name
}

// --- NEW TYPES FOR BROADCAST & QUEUE ---

export interface QueueItem {
    id: string;
    content: string;
    hasMedia: boolean; 
    mediaType?: 'image' | 'video' | 'audio';
    // Inline buttons support
    rows: InlineRow[]; 
    settings: {
        pin: boolean;
        silent: boolean;
        protect: boolean;
        addReactions: boolean;
    };
    targetChannelId: string; // 'all' or specific ID
    status: 'pending' | 'sent' | 'failed';
    createdAt: number; // Scheduled time timestamp
    error?: string;
    mediaFiles?: MediaAttachment[]; // Support for file IDs in queue
}

export interface ChannelSchedule {
    channelId: string; // 'all' or specific ID
    intervalMinutes: number; // e.g. 60 for 1 hour, 1440 for 1 day
    lastSentAt: number;
    active: boolean;
}

// --- NEW TYPES FOR CHANNELS PAGE ---

export interface SavedChannel {
    id: string | number;
    type: 'channel' | 'group';
    title: string;
    username: string;
    photo?: string | null;
    addedAt: number;
    isAdmin: boolean;
    statusCheckTime: number;
    isLocked?: boolean;
}

export interface SentMessageLog {
    id: string | number;
    text: string;
    sentAt: number | string;
    messageId?: number;
    chatId?: string;
    hasMedia?: boolean;
    successCount?: number;
    failCount?: number;
    targetCount?: number;
}

export interface MediaFile {
    id: string;
    file: File | null;
    type: 'image' | 'video' | 'audio';
    preview: string;
    fileId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // تومان
  description: string;
  imageUrl?: string;
  active: boolean;
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface Order {
  id: string;
  userId: string; // آیدی عددی کاربر تلگرام
  userFirstName: string;
  items: { productId: string; name: string; price: number; qty: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: number;
}

