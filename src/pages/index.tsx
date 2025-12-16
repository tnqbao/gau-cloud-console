import Head from "next/head";
import Link from "next/link";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const features = [
  {
    title: "Object Storage",
    description: "Store and retrieve any amount of data with S3-compatible bucket storage. Secure, scalable, and reliable.",
  },
  {
    title: "IAM Management",
    description: "Control access with identity and access management. Create users, manage permissions, and secure your resources.",
  },
  {
    title: "Message Queues",
    description: "Decouple your applications with reliable message queuing. Process messages asynchronously at scale.",
  },
  {
    title: "Virtual Machines",
    description: "Deploy and manage virtual machines with ease. Scale compute resources on demand. (Coming Soon)",
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Home Cloud - Your Personal Cloud Platform</title>
        <meta
          name="description"
          content="Home Cloud Orchestrator - A self-hosted AWS-like cloud platform for your home infrastructure"
        />
      </Head>

      <PublicLayout>
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Your Personal Cloud
              <span className="block text-primary">Infrastructure</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Deploy and manage cloud services at home. Object storage, IAM, message queues,
              and more — all with an AWS-like experience.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Cloud Services</h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to build and run your applications
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">
              Create your account and start deploying cloud services in minutes.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">Create Free Account</Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}

