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
              <a
                href="https://github.com/tnqbao/gauas-cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  View on GitHub
                </Button>
              </a>
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

