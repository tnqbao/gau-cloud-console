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
        <title>Gauas Cloud - Open Source Cloud Platform</title>
        <meta
          name="description"
          content="Gauas Cloud - An open source, self-hosted cloud platform for your infrastructure. S3-compatible storage, IAM, and more."
        />
      </Head>

      <PublicLayout>
        <section className="py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Open Source Cloud
              <span className="block text-primary">Platform</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground px-2">
              Self-hosted, open source cloud infrastructure. Object storage, IAM, message queues,
              and more - built for developers who value control and transparency.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">Get Started Free</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Cloud Services</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
                Everything you need to build and run your applications
              </p>
            </div>

            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
              Create your account and start deploying cloud services in minutes.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link href="/register" className="w-full sm:w-auto inline-block">
                <Button size="lg" className="w-full sm:w-auto">Create Free Account</Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}

