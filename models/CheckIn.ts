import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICheckIn extends Document {
  ticketId?: mongoose.Types.ObjectId;
  submissionId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: Date;
  checkedInBy: string;
  checkedInByName: string;
  method: string;
  isDuplicate: boolean;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: false },
    submissionId: { type: Schema.Types.ObjectId, ref: "FormSubmission", required: false },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    checkedInAt: { type: Date, required: true },
    checkedInBy: { type: String, required: true },
    checkedInByName: { type: String, required: true },
    method: { type: String, required: true },
    isDuplicate: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const CheckIn: Model<ICheckIn> = mongoose.models.CheckIn || mongoose.model<ICheckIn>("CheckIn", CheckInSchema);

export default CheckIn;