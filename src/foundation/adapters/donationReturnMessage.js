export function donationReturnMessage(record, canceled) {
  if (record?.status === "COMPLETED")
    return record.frequency === "MONTHLY"
      ? "Your first monthly gift is confirmed. Future gifts depend on each successful monthly payment."
      : "Your donation is confirmed. Thank you for supporting SHF.";
  if (record?.status === "FAILED")
    return "The payment was not confirmed. You can return to giving to try again.";
  if (record?.status === "CANCELED")
    return "This giving request ended without a confirmed donation.";
  return canceled
    ? "You returned from checkout. No completed donation is confirmed here. You can return to giving or refresh the payment status."
    : "Thank you. We are confirming your donation. A return from checkout does not confirm payment.";
}
