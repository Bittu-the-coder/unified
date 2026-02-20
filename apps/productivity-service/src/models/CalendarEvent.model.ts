import { Schema, model } from 'mongoose';

export interface ICalendarEvent {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  recurrencePattern?: Record<string, unknown>;
  reminderTime?: number;
  color?: string;
}

const schema = new Schema<ICalendarEvent>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    isAllDay: { type: Boolean, default: false },
    recurrencePattern: { type: Schema.Types.Mixed },
    reminderTime: { type: Number },
    color: { type: String },
  },
  { timestamps: true },
);

schema.index({ userId: 1, startTime: 1, endTime: 1 });

export const CalendarEventModel = model<ICalendarEvent>('calendar_events', schema);
