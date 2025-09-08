export const metadata = { title: 'Contact - Roboshop' };

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <div className="max-w-3xl space-y-3 text-muted-foreground">
        <p>Email: support@example.com</p>
        <p>Phone: +880-000-000-000</p>
        <p>Address: 123 Robotics Street, Dhaka</p>
      </div>
    </div>
  );
}
