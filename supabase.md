========================
CODE SNIPPETS
========================
TITLE: Supabase Studio Local Development Quickstart
DESCRIPTION: Provides a quick guide for developers to set up and run Supabase Studio locally. It details the necessary Node.js version, dependency installation, internal secret pulling, starting the development server, and running tests.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/studio/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
# You'll need to be on Node v20
# in /studio

npm i # install dependencies
npm run dev:secrets:pull # Supabase internal use: if you are working on the platform version of the Studio
npm run dev # start dev server
npm run test # run tests
npm run -- --watch # run tests in watch mode
```

----------------------------------------

TITLE: Supabase SvelteKit User Management Setup Workflow
DESCRIPTION: This section details the sequential steps required to set up a Supabase project for user management and integrate it with a SvelteKit application. It covers project creation, database quickstart execution, API key retrieval, environment variable configuration, and the final application launch.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/sveltekit-user-management/README.md#_snippet_0

LANGUAGE: APIDOC
CODE:
```
Supabase Project Setup & Application Execution:

1. Project Creation:
   - Endpoint: https://supabase.com/dashboard
   - Method: Manual UI interaction
   - Description: Sign up and create a new Supabase project.
   - Pre-requisite: Wait for database initialization.

2. Database Quickstart Execution:
   - Location: Supabase Project SQL Editor
   - Action: Run "User Management Starter" quickstart query.
   - Outcome: Creation of 'profiles' table with initial schema.

3. API Key Retrieval:
   - Location: Project Settings (cog icon) -> API tab
   - Keys:
     - API URL: Your project's API endpoint.
     - `anon` key: Client-side API key for anonymous access; switches to user's token post-login.
     - `service_role` key: Full access, server-side only; must be kept secret.

4. Environment Variable Configuration:
   - File: `.env.local` (created from `.env.example`)
   - Variables: Populate with retrieved API URL and `anon` key.

5. Application Launch:
   - Command: `npm run dev`
   - Access: `https://localhost:5173/`
```

----------------------------------------

TITLE: Install Laravel Breeze Authentication
DESCRIPTION: Install Laravel Breeze, a simple and minimal starter kit for Laravel's authentication features. This involves requiring the Breeze package via Composer and then running the `breeze:install` Artisan command to set up the necessary views and routes.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
composer require laravel/breeze --dev
php artisan breeze:install
```

----------------------------------------

TITLE: Start Next.js Development Server
DESCRIPTION: This snippet provides commands to launch the Next.js development server using various package managers (npm, yarn, pnpm, bun). Running one of these commands will start the application locally, typically accessible via http://localhost:3000, and enable hot-reloading for development purposes.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/clerk/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

----------------------------------------

TITLE: Install Dependencies and Run Development Server with Bun
DESCRIPTION: This snippet provides the essential command-line instructions for a Bun-based project. It first installs all required project dependencies and then starts the local development server, making the application accessible via a web browser.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/oauth-app-authorization-flow/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
bun install
bun run dev
```

----------------------------------------

TITLE: Install Dependencies and Start All Supabase Applications
DESCRIPTION: This set of commands guides you through installing all necessary project dependencies in the root of the Supabase monorepo using `pnpm install`. It then shows how to copy the example environment file for the `www` application and finally, how to start all Supabase applications simultaneously for local development using `pnpm dev`.

SOURCE: https://github.com/supabase/supabase/blob/master/DEVELOPERS.md#_snippet_1

LANGUAGE: sh
CODE:
```
pnpm install # install dependencies
cp apps/www/.env.local.example apps/www/.env.local
pnpm dev # start all the applications
```

----------------------------------------

TITLE: Start Local Supabase Docs Development Server
DESCRIPTION: Command to navigate to the Supabase docs application directory and start the Next.js development server, making the local site accessible in a web browser.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/DEVELOPERS.md#_snippet_1

LANGUAGE: Shell
CODE:
```
cd /apps/docs
npm run dev
```

----------------------------------------

TITLE: Install and Run Supabase with Docker (General Setup)
DESCRIPTION: This script clones the Supabase Docker repository, creates a project directory, copies necessary files, sets up environment variables, pulls Docker images, and starts the Supabase services in detached mode. This is the recommended general setup for quick deployment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/self-hosting/docker.mdx#_snippet_0

LANGUAGE: sh
CODE:
```
# Get the code
git clone --depth 1 https://github.com/supabase/supabase

# Make your new supabase project directory
mkdir supabase-project

# Tree should look like this
# .
# ├── supabase
# └── supabase-project

# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project

# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env

# Switch to your project directory
cd supabase-project

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

----------------------------------------

TITLE: Displaying Supabase Web App Demos with JSX
DESCRIPTION: This JSX code defines an array of web application tutorial demos, covering frameworks like Next.js, React, Vue 3, and Angular. It dynamically renders these tutorials as GlassPanel components, providing users with links to full-fledged examples demonstrating Supabase's database, authentication, and storage functionalities.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started.mdx#_snippet_3

LANGUAGE: JSX
CODE:
```
{
  [
    {
      title: 'Next.js',
      href: '/guides/getting-started/tutorials/with-nextjs',
      description:
        'Learn how to build a user management app with Next.js and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/nextjs-icon',
      hasLightIcon: true
    },
    {
      title: 'React',
      href: '/guides/getting-started/tutorials/with-react',
      description:
        'Learn how to build a user management app with React and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/react-icon'
    },
    {
      title: 'Vue 3',
      href: '/guides/getting-started/tutorials/with-vue-3',
      description:
        'Learn how to build a user management app with Vue 3 and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/vuejs-icon'
    },
    {
      title: 'Nuxt 3',
      href: '/guides/getting-started/tutorials/with-nuxt-3',
      description:
        'Learn how to build a user management app with Nuxt 3 and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/nuxt-icon'
    },
    {
      title: 'Angular',
      href: '/guides/getting-started/tutorials/with-angular',
      description:
        'Learn how to build a user management app with Angular and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/angular-icon'
    },
    {
      title: 'RedwoodJS',
      href: '/guides/getting-started/tutorials/with-redwoodjs',
      description:
        'Learn how to build a user management app with RedwoodJS and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/redwood-icon'
    },
    {
      title: 'Svelte',
      href: '/guides/getting-started/tutorials/with-svelte',
      description:
        'Learn how to build a user management app with Svelte and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/svelte-icon'
    },
    {
      title: 'SvelteKit',
      href: '/guides/getting-started/tutorials/with-sveltekit',
      description:
        'Learn how to build a user management app with SvelteKit and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/svelte-icon'
    },
    {
      title: 'refine',
      href: '/guides/getting-started/tutorials/with-refine',
      description:
        'Learn how to build a user management app with refine and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/refine-icon'
    }
]
.map((item) => {
    return (
      <Link href={`${item.href}`} key={item.title} passHref className={'col-span-4'}>
        <GlassPanel
          title={item.title}
          span="col-span-6"
          background={false}
          icon={item.icon}
          hasLightIcon={item.hasLightIcon}
        >
          {item.description}
        </GlassPanel>
      </Link>
    )

})}
```

----------------------------------------

TITLE: Create Expo app from example
DESCRIPTION: Command to quickly scaffold a new Expo project pre-configured with the `with-legend-state-supabase` example, providing a ready-to-run starting point for the tutorial.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-09-23-local-first-expo-legend-state.mdx#_snippet_0

LANGUAGE: Bash
CODE:
```
npx create-expo-app --example with-legend-state-supabase
```

----------------------------------------

TITLE: Installing Prisma Client and Generating Models - bun
DESCRIPTION: These commands install the Prisma client library as a dependency and then generate the Prisma client code based on your 'schema.prisma', allowing your application to interact with the database.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/prisma.mdx#_snippet_19

LANGUAGE: sh
CODE:
```
bun install @prisma/client
bunx prisma generate
```

----------------------------------------

TITLE: Supabase local development credentials output
DESCRIPTION: Example output displayed after successfully starting the Supabase local development setup. It provides the URLs and keys for various local Supabase services, including the API, Database, Studio, Mailpit, and the anonymous and service role keys.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development/cli/getting-started.mdx#_snippet_5

LANGUAGE: console
CODE:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
     Mailpit URL: http://localhost:54324
        anon key: eyJh......
service_role key: eyJh......
```

----------------------------------------

TITLE: Start Next.js Development Server
DESCRIPTION: This snippet provides commands to launch the Next.js development server, which enables hot-reloading and makes the application accessible locally, typically at `http://localhost:3000`. Choose the command corresponding to your preferred package manager (npm, yarn, pnpm, or bun).

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
```

LANGUAGE: bash
CODE:
```
yarn dev
```

LANGUAGE: bash
CODE:
```
pnpm dev
```

LANGUAGE: bash
CODE:
```
bun dev
```

----------------------------------------

TITLE: Installing Prisma Client and Generating Models - npm
DESCRIPTION: These commands install the Prisma client library as a dependency and then generate the Prisma client code based on your 'schema.prisma', allowing your application to interact with the database.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/prisma.mdx#_snippet_16

LANGUAGE: sh
CODE:
```
npm install @prisma/client
npx prisma generate
```

----------------------------------------

TITLE: Install Select Component via shadcn-ui CLI
DESCRIPTION: Installs the `Select` component into your project using the shadcn-ui command-line interface, automating the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/select.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add select
```

----------------------------------------

TITLE: Start Laravel Development Server
DESCRIPTION: Launch the Laravel development server to make the application accessible via a web browser. This command starts a local server, typically at `http://127.0.0.1:8000`, allowing for testing and interaction with the application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
php artisan serve
```

----------------------------------------

TITLE: Install and Setup Python Environment with Poetry
DESCRIPTION: These commands guide the user through installing the Poetry package manager, activating its virtual environment, and installing project dependencies for a Python application. This ensures all required libraries are available before running the image search application.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/image_search/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
pip install poetry
poetry shell
poetry install
```

----------------------------------------

TITLE: Initialize SvelteKit App and Install Supabase Client
DESCRIPTION: This snippet guides you through setting up a new SvelteKit project, navigating into the project directory, installing initial dependencies, and then adding the Supabase JavaScript client library to your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-sveltekit.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx sv create supabase-sveltekit
cd supabase-sveltekit
npm install
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Install and Run Supabase with Docker (Advanced Setup)
DESCRIPTION: This script uses Git sparse checkout for a more advanced setup, cloning only the necessary Docker files from the Supabase repository. It then proceeds to create a project directory, copy files, set environment variables, pull Docker images, and start Supabase services in detached mode.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/self-hosting/docker.mdx#_snippet_1

LANGUAGE: sh
CODE:
```
# Get the code using git sparse checkout
git clone --filter=blob:none --no-checkout https://github.com/supabase/supabase
cd supabase
git sparse-checkout set --cone docker && git checkout master
cd ..

# Make your new supabase project directory
mkdir supabase-project

# Tree should look like this
# .
# ├── supabase
# └── supabase-project

# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project

# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env

# Switch to your project directory
cd supabase-project

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

----------------------------------------

TITLE: Start Next.js Development Server
DESCRIPTION: This snippet provides commands to launch the Next.js development server, which enables hot-reloading and makes the application accessible locally, typically at `http://localhost:3000`. Choose the command corresponding to your preferred package manager (npm, yarn, pnpm, or bun).

SOURCE: https://github.com/supabase/supabase/blob/master/examples/caching/with-react-query-nextjs-14/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
```

LANGUAGE: bash
CODE:
```
yarn dev
```

LANGUAGE: bash
CODE:
```
pnpm dev
```

LANGUAGE: bash
CODE:
```
bun dev
```

----------------------------------------

TITLE: Setup Supabase Environment Variables
DESCRIPTION: This command copies the example environment file (`.env.local.example`) to `.env.local`. This is a crucial first step for configuring local development settings, including API keys and other sensitive information required by the Supabase functions.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/openai/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
cp supabase/.env.local.example supabase/.env.local
```

----------------------------------------

TITLE: Installing Prisma Client and Generating Models - pnpm
DESCRIPTION: These commands install the Prisma client library as a dependency and then generate the Prisma client code based on your 'schema.prisma', allowing your application to interact with the database.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/prisma.mdx#_snippet_17

LANGUAGE: sh
CODE:
```
pnpm install @prisma/client
pnpx prisma generate
```

----------------------------------------

TITLE: Supabase Bootstrap Command Variations
DESCRIPTION: Different methods to invoke the `supabase bootstrap` command, allowing users to start a new Supabase project setup directly via the Supabase CLI, or through npm and bun package managers, without needing a global CLI installation.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-04-15-supabase-bootstrap.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
supabase bootstrap
```

LANGUAGE: bash
CODE:
```
npx supabase@latest bootstrap
```

LANGUAGE: bash
CODE:
```
bunx supabase@latest bootstrap
```

----------------------------------------

TITLE: Install Resizable component using shadcn-ui CLI
DESCRIPTION: Installs the Resizable component and its dependencies into your project using the shadcn-ui command-line interface, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/resizable.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add resizable
```

----------------------------------------

TITLE: Payload CMS Local Development Setup
DESCRIPTION: Provides step-by-step instructions to set up and run the Payload CMS application locally. This involves starting a local Supabase project, configuring environment variables, installing project dependencies, and launching the development server. Ensure Supabase CLI and pnpm are installed.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/cms/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
cd apps/cms && supabase start
cp .env.example .env
pnpm install && pnpm generate:importmap
pnpm dev
pnpm dev:cms
```

----------------------------------------

TITLE: Installing Prisma Client and Generating Models - yarn
DESCRIPTION: These commands install the Prisma client library as a dependency and then generate the Prisma client code based on your 'schema.prisma', allowing your application to interact with the database.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/prisma.mdx#_snippet_18

LANGUAGE: sh
CODE:
```
yarn add @prisma/client
npx prisma generate
```

----------------------------------------

TITLE: Install Dependencies and Run Supabase Studio
DESCRIPTION: Commands to install Node.js dependencies and start the Supabase Studio dashboard after configuring the essential environment variables in the `.env` file.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/studio/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
npm install
npm run dev
```

----------------------------------------

TITLE: Get Homebrew PostgreSQL Path Information on macOS
DESCRIPTION: This command provides detailed information about the Homebrew installation of PostgreSQL, including its installation path. This information is useful for manually adding PostgreSQL binaries to the system's PATH variable if they are not automatically detected.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/postgres_installation.mdx#_snippet_2

LANGUAGE: sh
CODE:
```
brew info postgresql@17
```

----------------------------------------

TITLE: Verify psql Client Installation
DESCRIPTION: This command verifies that the `psql` (PostgreSQL client) is correctly installed and accessible from the system's PATH. It outputs the version of the `psql` client, which is a crucial step after installing PostgreSQL on both Windows and macOS.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/postgres_installation.mdx#_snippet_1

LANGUAGE: sh
CODE:
```
psql --version
```

----------------------------------------

TITLE: Start the Rails development server
DESCRIPTION: Run the Rails development server, making the application accessible via a web browser. By default, the application will be available at `http://127.0.0.1:3000`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
bin/rails server
```

----------------------------------------

TITLE: Install vecs Python client
DESCRIPTION: Installs the `vecs` Python client library using pip. This client is used for interacting with PostgreSQL databases equipped with the `pgvector` extension. Requires Python 3.7+.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb#_snippet_0

LANGUAGE: Python
CODE:
```
pip install vecs
```

----------------------------------------

TITLE: Install Supabase JavaScript client
DESCRIPTION: This command installs the `@supabase/supabase-js` package using npm. This client library is essential for interacting with Supabase services, including database changes, from a JavaScript application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/realtime/postgres-changes.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Downloading a File with Dart
DESCRIPTION: This Dart snippet initializes a Supabase client and then uses its storage API to asynchronously download a file named 'example.txt' from the 'public' bucket. The downloaded content is returned in the `storageResponse`, allowing for subsequent processing or display within the application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/quickstart.mdx#_snippet_8

LANGUAGE: Dart
CODE:
```
void main() async {
  final supabase = SupabaseClient('supabaseUrl', 'supabaseKey');

  final storageResponse = await supabase
      .storage
      .from('public')
      .download('example.txt');
}
```

----------------------------------------

TITLE: Install Dropdown Menu Component via CLI
DESCRIPTION: Installs the `dropdown-menu` component using the `shadcn-ui` CLI tool, simplifying the setup process by adding the component and its dependencies to your project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/dropdown-menu.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add dropdown-menu
```

----------------------------------------

TITLE: Install Sidebar component using CLI
DESCRIPTION: Run this command to automatically install the `sidebar.tsx` component and its dependencies using the shadcn/ui CLI. This is the recommended method for quick setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/sidebar.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn@latest add sidebar
```

----------------------------------------

TITLE: Install Supabase.js and Dependencies for React Native
DESCRIPTION: This command installs the necessary Supabase JavaScript client (`@supabase/supabase-js`) along with `@react-native-async-storage/async-storage` for persistent session storage and `react-native-url-polyfill` for URL polyfilling in a React Native Expo project. These packages are essential for integrating Supabase authentication reliably.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

----------------------------------------

TITLE: Install Card component via shadcn-ui CLI
DESCRIPTION: Installs the Card UI component into your project using the shadcn-ui command-line interface, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/card.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add card
```

----------------------------------------

TITLE: Install Textarea Component via CLI
DESCRIPTION: This command installs the Textarea component using the shadcn-ui CLI. It's the recommended method for quick setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/textarea.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add textarea
```

----------------------------------------

TITLE: Install RNEUI Themed for React Native UI Components
DESCRIPTION: This command installs the `@rneui/themed` package, which provides a comprehensive set of cross-platform UI components like buttons and input fields for React Native applications. It simplifies the process of building consistent and visually appealing user interfaces.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_4

LANGUAGE: Bash
CODE:
```
npm install @rneui/themed
```

----------------------------------------

TITLE: Install Supabase CLI
DESCRIPTION: Provides various methods to install the Supabase CLI on different operating systems and environments, including macOS, Windows, Linux, and Node.js-based setups.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development/cli/getting-started.mdx#_snippet_0

LANGUAGE: sh
CODE:
```
brew install supabase/tap/supabase
```

LANGUAGE: powershell
CODE:
```
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

LANGUAGE: sh
CODE:
```
sudo apk add --allow-untrusted <...>.apk
sudo dpkg -i <...>.deb
sudo rpm -i <...>.rpm
```

LANGUAGE: sh
CODE:
```
npx supabase --help
```

LANGUAGE: sh
CODE:
```
npm install supabase --save-dev
```

----------------------------------------

TITLE: Interact with Rails database using console
DESCRIPTION: Launch the Rails console to interact with the application's models and database directly. This example demonstrates creating a new 'Article' record, saving it to the database, and then retrieving all existing 'Article' records.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
bin/rails console
```

LANGUAGE: ruby
CODE:
```
article = Article.new(title: "Hello Rails", body: "I am on Rails!")
article.save # Saves the entry to the database

Article.all
```

----------------------------------------

TITLE: Initialize SolidJS App and Install Supabase.js
DESCRIPTION: This snippet demonstrates how to initialize a new SolidJS application using `degit` and then install the `supabase-js` client library as a dependency. These are the foundational steps to set up your project environment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-solidjs.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx degit solidjs/templates/ts supabase-solid
cd supabase-solid
```

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Install and Start Roboflow Inference Server
DESCRIPTION: This command installs the necessary Python packages for Roboflow Inference and starts the local inference server. Ensure Docker is installed and running on your machine before executing this command, as Roboflow Inference relies on Docker for deployment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/integrations/roboflow.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
pip install inference inference-cli inference-sdk && inference server start
```

----------------------------------------

TITLE: Create Next.js Supabase Quickstart Application
DESCRIPTION: This command initializes a new Next.js project pre-configured with Supabase integration. It downloads a quickstart application that can be used as a reference or starting point for implementing Supabase authentication with server-side rendering.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
npx create-next-app -e with-supabase
```

----------------------------------------

TITLE: Run the initialized refine development server
DESCRIPTION: Navigates into the project directory and starts the development server for the refine application. This command launches the app, typically making it accessible on `http://localhost:5173`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-refine.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
cd app-name
npm run dev
```

----------------------------------------

TITLE: Install Switch component via shadcn-ui CLI
DESCRIPTION: Installs the Switch component and its dependencies into your project using the shadcn-ui command-line interface. This is the recommended method for quick setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/switch.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add switch
```

----------------------------------------

TITLE: Install Alert Dialog via CLI
DESCRIPTION: Installs the Alert Dialog component using the shadcn-ui CLI tool, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/alert-dialog.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add alert-dialog
```

----------------------------------------

TITLE: Initialize and run a new Flutter application
DESCRIPTION: This snippet outlines the initial steps to create a new Flutter project using the `flutter create` command and then navigate into its directory to run the default application. It's the foundational setup for any Flutter development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-06-30-flutter-tutorial-building-a-chat-app.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create my_chat_app
cd my_chat_app
flutter run
```

----------------------------------------

TITLE: Install Tooltip component using Shadcn UI CLI
DESCRIPTION: This command installs the Tooltip component into your project using the Shadcn UI command-line interface, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/tooltip.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add tooltip
```

----------------------------------------

TITLE: Implement Supabase Authentication with Type Hints
DESCRIPTION: Provides an example of integrating `supabase-js` for user authentication, specifically `signInWithPassword`. It demonstrates how to include setup code (like client initialization) above a 'cut' line (`// ---cut---`) to provide context for type hints without displaying the setup code in the final snippet.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/app/contributing/content.mdx#_snippet_8

LANGUAGE: javascript
CODE:
```
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('dummy', 'client')

// ---cut---
const result = supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test1234',
})
```

----------------------------------------

TITLE: Install Radix UI Select Dependencies Manually
DESCRIPTION: Installs the core `@radix-ui/react-select` dependency, which is required for manual setup of the `Select` component in your project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/select.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-select
```

----------------------------------------

TITLE: Uploading a File with Dart
DESCRIPTION: This Dart snippet shows how to create a local file (`example.txt`) and then upload it to a Supabase storage bucket. It initializes a Supabase client, writes content to the file, and uploads it to the 'public' bucket using the `from()` and `upload()` methods, demonstrating file preparation before upload.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/quickstart.mdx#_snippet_6

LANGUAGE: Dart
CODE:
```
void main() async {
  final supabase = SupabaseClient('supabaseUrl', 'supabaseKey');

  // Create file `example.txt` and upload it in `public` bucket
  final file = File('example.txt');
  file.writeAsStringSync('File content');
  final storageResponse = await supabase
      .storage
      .from('public')
      .upload('example.txt', file);
}
```

----------------------------------------

TITLE: Invoke Supabase Edge Function from Client Applications
DESCRIPTION: Examples demonstrating how to invoke a deployed Supabase Edge Function from a client-side application using either the Supabase JavaScript client library or the standard Fetch API.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_11

LANGUAGE: jsx
CODE:
```
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://[YOUR_PROJECT_ID].supabase.co', 'YOUR_ANON_KEY')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'JavaScript' },
})

console.log(data) // { message: "Hello JavaScript!" }
```

LANGUAGE: jsx
CODE:
```
const response = await fetch('https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Fetch' }),
})

const data = await response.json()
console.log(data)
```

----------------------------------------

TITLE: Install dependencies for encrypted Supabase session storage in Expo
DESCRIPTION: This section outlines the required npm and Expo packages to install for implementing encrypted user session storage. It includes `@supabase/supabase-js` for Supabase integration, `@react-native-async-storage/async-storage` for data storage, `aes-js` for encryption, `react-native-get-random-values` for key generation, and `expo-secure-store` for secure key storage.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
npm install @rneui/themed @react-native-async-storage/async-storage react-native-url-polyfill
npm install aes-js react-native-get-random-values
npx expo install expo-secure-store
```

----------------------------------------

TITLE: Install PostgreSQL on macOS with Homebrew
DESCRIPTION: This command installs PostgreSQL version 17 using Homebrew on macOS. Homebrew is a popular package manager that simplifies software installation on macOS systems.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/postgres_installation.mdx#_snippet_0

LANGUAGE: sh
CODE:
```
brew install postgresql@17
```

----------------------------------------

TITLE: Create Laravel Project
DESCRIPTION: Scaffold a new Laravel project using Composer's `create-project` command. This command initializes a fresh Laravel application in the specified directory.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
composer create-project laravel/laravel example-app
```

----------------------------------------

TITLE: Supabase Edge Function starter code (TypeScript)
DESCRIPTION: Provides the default TypeScript code for a newly generated Supabase Edge Function. This example demonstrates a Deno-based function that accepts a JSON payload with a `name` field and returns a greeting message.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

----------------------------------------

TITLE: Run Next.js Development Server
DESCRIPTION: This snippet provides commands to start the Next.js development server using various package managers. It allows developers to run the application locally for testing and development purposes, typically accessible via `http://localhost:3000`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/ui-library/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

----------------------------------------

TITLE: Initialize React App and Install Supabase Client
DESCRIPTION: This snippet demonstrates how to set up a new React project using Vite, navigate into the project directory, and install the `supabase-js` library, which is essential for interacting with Supabase services.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-react.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm create vite@latest supabase-react -- --template react
cd supabase-react
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Start Supabase Development Server
DESCRIPTION: This command initiates the local development server for your Supabase project. Once started, the application will be accessible in your web browser at `http://localhost:5173`, allowing you to view and interact with your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/quickstarts/sveltekit.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Build React Application for Production with npm
DESCRIPTION: Compiles the React application into the `build` folder, optimizing it for production deployment. This command bundles React in production mode, minifies the code, and includes hashes in filenames for caching, preparing the application for deployment.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_2

LANGUAGE: shell
CODE:
```
npm run build
```

----------------------------------------

TITLE: Create new Flutter application
DESCRIPTION: Initializes a new Flutter project named 'myauthapp'. This command sets up the basic directory structure and necessary files for a Flutter application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-07-18-flutter-authentication.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create myauthapp
```

----------------------------------------

TITLE: Initialize a RedwoodJS Application
DESCRIPTION: Use the `create redwood-app` command to scaffold a new RedwoodJS project. This command sets up the basic project structure and installs necessary dependencies, followed by navigating into the new project directory.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
yarn create redwood-app supabase-redwoodjs
cd supabase-redwoodjs
```

----------------------------------------

TITLE: Install and setup project dependencies
DESCRIPTION: Commands to install the Poetry dependency manager, activate the project's virtual environment, and install all required application dependencies for the image search project.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/aws_bedrock_image_search/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
pip install poetry
poetry shell
poetry install
```

----------------------------------------

TITLE: Initialize Supabase Project and Start Postgres
DESCRIPTION: This Bash script initializes a new Supabase project and starts a local PostgreSQL instance. It requires the Supabase CLI to be installed and Docker to be running. This sets up the local environment for using the `vecs` client.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/vecs-python-client.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
# Initialize your project
supabase init

# Start Postgres
supabase start
```

----------------------------------------

TITLE: Run React Development Server with npm
DESCRIPTION: Starts the React application in development mode, making it accessible via a web browser at http://localhost:3000. The page automatically reloads upon code changes, and any lint errors are displayed directly in the console.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
npm start
```

----------------------------------------

TITLE: Create a new Rails project with PostgreSQL
DESCRIPTION: Scaffold a new Ruby on Rails project, specifying PostgreSQL as the database adapter. This command initializes the project directory and sets up the basic structure for a Rails application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
rails new blog -d=postgresql
```

----------------------------------------

TITLE: Run Next.js Local Development Server
DESCRIPTION: Start the Next.js development server to run your application locally. This command compiles your code and serves it, typically on `localhost:3000`, allowing you to test and develop your application in real-time.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/auth/nextjs/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet provides build file configurations for integrating Jackson with Supabase-kt. It includes an example for Gradle Kotlin DSL (build.gradle.kts) to add the `serializer-jackson` dependency.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/v1/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Starting Local Supabase Stack and Development Server (Bash)
DESCRIPTION: These commands initiate the local Supabase development stack and start the Next.js application. This allows for testing the integrated Supabase and Dotenvx setup in a local environment by visiting `localhost:3000`.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/slack-clone/nextjs-slack-clone-dotenvx/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
npx supabase start
npm run dev
```

----------------------------------------

TITLE: Expo Project Setup and Development Commands
DESCRIPTION: Commands to install project dependencies, initialize Expo Application Services (EAS) for build management, and start the Expo development server for a dev client on a physical device.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/expo-push-notifications/README.md#_snippet_1

LANGUAGE: Shell
CODE:
```
npm i
npm install --global eas-cli && eas init --id your-expo-project-id
npx expo start --dev-client
```

----------------------------------------

TITLE: Start local Supabase services and serve Edge Function
DESCRIPTION: Starts all local Supabase services, including the database and authentication, and serves a specific Edge Function. This makes the function accessible via a local URL (e.g., `http://localhost:54321/functions/v1/hello-world`) with hot reloading enabled.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
supabase start  # Start all Supabase services
supabase functions serve hello-world
```

----------------------------------------

TITLE: SQL Schema and Data Setup for Supabase Explain Example
DESCRIPTION: SQL script to create an `instruments` table with `id` and `name` columns, and then insert sample data. This provides a foundational dataset for illustrating the functionality of the `explain()` method in Supabase. It's a prerequisite for testing query plans.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/debugging-performance.mdx#_snippet_2

LANGUAGE: SQL
CODE:
```
create table instruments (
  id int8 primary key,
  name text
);

insert into books
  (id, name)
values
  (1, 'violin'),
  (2, 'viola'),
  (3, 'cello');
```

----------------------------------------

TITLE: Install Carousel Component via CLI
DESCRIPTION: Installs the carousel component using the shadcn-ui CLI tool, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/carousel.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add carousel
```

----------------------------------------

TITLE: Starting Development Server with Bun
DESCRIPTION: This command initiates the development server for the Supabase OAuth application using Bun. Once started, the application will typically be accessible via a web browser at http://localhost:3000.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/oauth-app-authorization-flow/README.md#_snippet_1

LANGUAGE: Shell
CODE:
```
bun run dev
```

----------------------------------------

TITLE: Run Hono Development Server
DESCRIPTION: Command to start the development server for the Hono application using Vite. This enables live reloading and local testing during development, facilitating rapid iteration.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/auth/hono/README.md#_snippet_2

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Install Toggle component via shadcn-ui CLI
DESCRIPTION: Installs the Toggle component into your project using the shadcn-ui command-line interface. This method automates the setup and integration of the component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/toggle.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add toggle
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet provides build file configurations for integrating Jackson with Supabase-kt. It includes an example for Gradle Kotlin DSL (build.gradle.kts) to add the `serializer-jackson` dependency.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/v2/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Install Alert Component via CLI
DESCRIPTION: Installs the Alert UI component using the shadcn-ui CLI tool. This command automatically adds the necessary component files and dependencies to your project, streamlining the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/alert copy.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add alert
```

----------------------------------------

TITLE: Install Dependencies and Run React Native Project
DESCRIPTION: These commands are used to set up and run the React Native application. `npm install` installs all necessary project dependencies, `npm run prebuild` prepares the project for specific functionalities like file pickers, and `npm start` launches the application in development mode.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/expo-user-management/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm install
```

LANGUAGE: bash
CODE:
```
npm run prebuild
```

LANGUAGE: bash
CODE:
```
npm start
```

----------------------------------------

TITLE: Initialize a New Flutter Project
DESCRIPTION: This command initializes a new Flutter application named `supabase_quickstart`. It sets up the basic project structure and necessary files for a Flutter development environment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-flutter.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create supabase_quickstart
```

----------------------------------------

TITLE: Invoke Supabase Edge Function from Application
DESCRIPTION: These code examples illustrate how to invoke a deployed Supabase Edge Function from a client-side application. They provide two common methods: using the official Supabase JavaScript client library for simplified interaction, and using the standard Fetch API for direct HTTP requests. Both examples demonstrate sending a JSON body and handling the function's response.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_10

LANGUAGE: jsx
CODE:
```
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://[YOUR_PROJECT_ID].supabase.co', 'YOUR_ANON_KEY')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'JavaScript' },
})

console.log(data) // { message: "Hello JavaScript!" }

```

LANGUAGE: jsx
CODE:
```
const response = await fetch('https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Fetch' }),
})

const data = await response.json()
console.log(data)

```

----------------------------------------

TITLE: Copy Example Environment File
DESCRIPTION: Copies the provided example environment configuration file (`.env.example`) to a new file named `.env`. This new file will store local environment variables required for the Docker setup.

SOURCE: https://github.com/supabase/supabase/blob/master/DEVELOPERS.md#_snippet_7

LANGUAGE: sh
CODE:
```
cp .env.example .env
```

----------------------------------------

TITLE: Initialize Supabase in Flutter Application
DESCRIPTION: Initializes the Supabase client within the `main` function of a Flutter application using `Supabase.initialize()`. This setup requires the Supabase project URL and anonymous key, which can be found in the Supabase dashboard, and prepares the app for authentication and database interactions.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-07-18-flutter-authentication.mdx#_snippet_3

LANGUAGE: dart
CODE:
```
import 'package:flutter/material.dart';
import 'package:myauthapp/screens/login_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  /// TODO: update Supabase credentials with your own
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_ANON_KEY',
  );
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Flutter Auth',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
```

----------------------------------------

TITLE: Test Live Supabase Edge Function with cURL
DESCRIPTION: Verify your deployed Supabase Edge Function by sending a POST request using cURL. This example demonstrates including authorization and content-type headers, along with a JSON payload, to test the function's response.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_8

LANGUAGE: curl
CODE:
```
curl --request POST 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world' \
  --header 'Authorization: Bearer SUPABASE_PUBLISHABLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Production"}'
```

----------------------------------------

TITLE: Rendering Supabase Mobile Tutorial Links with React
DESCRIPTION: This JavaScript/JSX snippet defines an array of objects, each representing a mobile tutorial with Supabase. It then uses the `map` function to iterate over this array, dynamically generating `Link` and `GlassPanel` components for each tutorial. This structure helps in presenting a grid of clickable tutorial cards, linking to specific guides for Flutter, Expo React Native, Android Kotlin, iOS Swift, and various Ionic frameworks.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started.mdx#_snippet_4

LANGUAGE: JSX
CODE:
```
{[
    {
      title: 'Flutter',
      href: '/guides/getting-started/tutorials/with-flutter',
      description:
        'Learn how to build a user management app with Flutter and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/flutter-icon'
    },
    {
      title: 'Expo React Native',
      href: '/guides/getting-started/tutorials/with-expo-react-native',
      description:
        'Learn how to build a user management app with Expo React Native and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/expo-icon',
      hasLightIcon: true
    },
    {
      title: 'Android Kotlin',
      href: '/guides/getting-started/tutorials/with-kotlin',
      description:
        'Learn how to build a product management app with Android and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/kotlin-icon'
    },
    {
      title: 'iOS Swift',
      href: '/guides/getting-started/tutorials/with-swift',
      description:
        'Learn how to build a user management app with iOS and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/swift-icon'
    },
    {
      title: 'Ionic React',
      href: '/guides/getting-started/tutorials/with-ionic-react',
      description:
        'Learn how to build a user management app with Ionic React and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/ionic-icon'
    },
    {
      title: 'Ionic Vue',
      href: '/guides/getting-started/tutorials/with-ionic-vue',
      description:
        'Learn how to build a user management app with Ionic Vue and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/ionic-icon'
    },
    {
      title: 'Ionic Angular',
      href: '/guides/getting-started/tutorials/with-ionic-angular',
      description:
        'Learn how to build a user management app with Ionic Angular and Supabase Database, Auth, and Storage functionality.',
      icon: '/docs/img/icons/ionic-icon'
    }
  ].map((item) => {
    return (
      <Link href={`${item.href}`} key={item.title} passHref className={'col-span-4'}>
        <GlassPanel
          title={item.title}
          span="col-span-6"
          background={false}
          icon={item.icon}
          hasLightIcon={item.hasLightIcon}
        >
          {item.description}
        </GlassPanel>
      </Link>
    )
})}
```

----------------------------------------

TITLE: Create New Supabase Migration File
DESCRIPTION: This command generates a new migration file for your Supabase project, useful when working locally to track database schema changes. The provided name 'user_management_starter' is an example for the migration.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/project_setup.mdx#_snippet_1

LANGUAGE: Bash
CODE:
```
supabase migration new user_management_starter
```

----------------------------------------

TITLE: Invoke Supabase Edge Function from Client Applications
DESCRIPTION: Call your deployed Supabase Edge Function from a client-side application. This snippet provides examples using the official Supabase JavaScript client library and the standard Fetch API, demonstrating how to pass data and handle responses.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_9

LANGUAGE: jsx
CODE:
```
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://[YOUR_PROJECT_ID].supabase.co', 'YOUR_ANON_KEY')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'JavaScript' },
})

console.log(data) // { message: "Hello JavaScript!" }
```

LANGUAGE: jsx
CODE:
```
const response = await fetch('https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Fetch' }),
})

const data = await response.json()
console.log(data)
```

----------------------------------------

TITLE: Example Component Directory Structure
DESCRIPTION: Illustrates the recommended directory structure for components, showing how to group related files (constants, utilities, types) within a component's folder using an `index.ts` entry point, or how to keep simple components as standalone files.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/studio/components/README.md#_snippet_0

LANGUAGE: text
CODE:
```
components/ui
- SampleComponentA
  - SampleComponentA.tsx
  - SampleComponentA.constants.ts
  - SampleComponentA.utils.ts
  - SampleComponentA.types.ts
  - index.ts
- SampleComponentB.tsx
```

----------------------------------------

TITLE: Install and Use olirice-index_advisor for PostgreSQL Index Recommendations
DESCRIPTION: This SQL example provides the steps to install the `olirice-index_advisor` and `hypopg` extensions, then demonstrates how to use the `index_advisor()` function. It shows how to create a dummy table and query `index_advisor` with a sample SQL query to receive recommendations for optimizing query performance by suggesting appropriate indexes.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-04-14-dbdev.mdx#_snippet_5

LANGUAGE: SQL
CODE:
```
select dbdev.install('olirice-index_advisor');
create extension if not exists hypopg;
create extension "olirice-index_advisor";

-- Create a dummy table
create table account(
	id int primary key,
	name text
);

-- Search for indexes to optimize "select id from account where name = 'adsf'"
select
	*
from
	index_advisor($$select id from account where name = 'Foo'$$)
```

----------------------------------------

TITLE: Initialize Supabase CLI Project
DESCRIPTION: Initializes a new Supabase project in the current directory, creating necessary configuration files and a `supabase` directory structure. This command requires the Supabase CLI to be installed and configured.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/nextjs-vector-search.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
supabase init
```

----------------------------------------

TITLE: Run SvelteKit Development Server
DESCRIPTION: This command initiates the SvelteKit development server, allowing you to preview and interact with the application locally. After running this command, the application will typically be accessible in your web browser at `http://localhost:5173`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-sveltekit.mdx#_snippet_17

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Initialize or configure a Supabase project
DESCRIPTION: Initializes a new Supabase project in the current directory or configures an existing one for Supabase CLI usage. This command creates the necessary `supabase` folder structure, including `config.toml` and an empty `functions` directory.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
supabase init my-edge-functions-project
cd my-edge-functions-project
```

LANGUAGE: bash
CODE:
```
cd your-existing-project
supabase init # Initialize Supabase, if you haven't already
```

----------------------------------------

TITLE: Install Radix UI Dialog Dependency Manually
DESCRIPTION: This command installs the `@radix-ui/react-dialog` dependency, which is required for the manual setup of the Sheet UI component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/sheet.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-dialog
```

----------------------------------------

TITLE: Install Python Dependencies for LlamaIndex and Supabase
DESCRIPTION: Installs the necessary Python packages required for the project, including `vecs` for vector operations, `datasets` for data handling, `llama_index` for the core framework, and `html2text` for HTML to text conversion. The `-qU` flags ensure a quiet and upgraded installation.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/llamaindex/llamaindex.ipynb#_snippet_0

LANGUAGE: python
CODE:
```
!pip install -qU vecs datasets llama_index html2text
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet provides build file configurations for integrating Jackson with Supabase-kt. It includes an example for Gradle Kotlin DSL (build.gradle.kts) to add the `serializer-jackson` dependency.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Copy example environment file for local development
DESCRIPTION: Copies the `.env.local.example` file to `.env.local`. This command is a standard first step in setting up a local development environment, allowing developers to configure environment variables without altering the version-controlled example file.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
cp .env.local.example .env.local
```

----------------------------------------

TITLE: Deploy Rails Application to Fly.io
DESCRIPTION: This command initiates the deployment of your application to Fly.io. It handles the upload of your application code, the building of a machine image, the deployment of the image, and monitors the application's startup process to ensure it runs successfully.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
fly deploy
```

----------------------------------------

TITLE: Expose Local Function with Tunneling Tools
DESCRIPTION: Provides commands to expose your locally running Supabase Function (typically on port 54321) to the internet using tunneling services. This is necessary for Discord to send interaction requests to your local development environment. Examples include Tunnelmole and ngrok.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/discord-bot/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
tmole 54321
```

LANGUAGE: bash
CODE:
```
ngrok http 54321
```

----------------------------------------

TITLE: Install Accordion Component via Shadcn UI CLI
DESCRIPTION: Run this command to automatically add the Accordion component and its dependencies to your project using the shadcn/ui CLI tool. This simplifies the setup process by handling file creation and dependency installation.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/accordion.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add accordion
```

----------------------------------------

TITLE: Install Sheet UI Component via shadcn-ui CLI
DESCRIPTION: This command installs the Sheet UI component using the shadcn-ui CLI, providing a quick and integrated setup for your project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/sheet.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add sheet
```

----------------------------------------

TITLE: Install Radix UI React Context Menu dependency manually
DESCRIPTION: Installs the core Radix UI React Context Menu dependency via npm for manual project setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/context-menu.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-context-menu
```

----------------------------------------

TITLE: Initialize Supabase Project with Bootstrap Command
DESCRIPTION: The `supabase bootstrap` command allows users to quickly set up a new hosted Supabase project from pre-built starter templates. It can be invoked directly via the Supabase CLI or through `npx` (for npm users) and `bunx` (for Bun users), creating a local project and linking it to a new remote database.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-04-15-supabase-bootstrap.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx supabase bootstrap
```

LANGUAGE: bash
CODE:
```
supabase bootstrap
```

LANGUAGE: bash
CODE:
```
npx supabase@latest bootstrap
```

LANGUAGE: bash
CODE:
```
bunx supabase@latest bootstrap
```

----------------------------------------

TITLE: Copy Environment Configuration File
DESCRIPTION: Copies the example environment configuration file (`.env.local.example`) to `.env.local` for local setup. Users should then edit this newly created file with their specific credentials and environment variables to customize the test environment.

SOURCE: https://github.com/supabase/supabase/blob/master/e2e/studio/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
cp .env.local.example .env.local
```

----------------------------------------

TITLE: Installing Supabase-JS v2
DESCRIPTION: This command line snippet shows how to install the Supabase-JS v2 library using npm. This is the recommended way to upgrade or start using the latest version of the client library.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-16-supabase-js-v2.mdx#_snippet_19

LANGUAGE: Bash
CODE:
```
npm i @supabase/supabase-js@2
```

----------------------------------------

TITLE: Install Embla Carousel React Dependency
DESCRIPTION: Installs the core Embla Carousel React library, which is a prerequisite for manual setup of the carousel component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/carousel.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install embla-carousel-react
```

----------------------------------------

TITLE: Native Apple Sign-in in Expo React Native with Supabase
DESCRIPTION: This example illustrates how to integrate native Apple authentication within an Expo React Native application. It leverages the `expo-apple-authentication` library to get an ID token, which is then passed to `supabase-js`'s `signInWithIdToken` method for user authentication.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/social-login/auth-apple.mdx#_snippet_5

LANGUAGE: tsx
CODE:
```
import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from 'app/utils/supabase'

export function Auth() {
      if (Platform.OS === 'ios')
        return (
          <AppleAuthentication.AppleAuthenticationButton
```

----------------------------------------

TITLE: Install and Configure Supabase dbdev Extension
DESCRIPTION: This SQL script installs the `http` and `pg_tle` extensions, uninstalls any existing `supabase-dbdev` extension, then fetches and installs the latest version of `supabase-dbdev` from `api.database.dev` using an HTTP GET request. It ensures a clean installation by dropping and recreating the extension.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development/testing/pgtap-extended.mdx#_snippet_0

LANGUAGE: sql
CODE:
```
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
drop extension if exists "supabase-dbdev";
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
select
    pgtle.install_extension(
        'supabase-dbdev',
        resp.contents ->> 'version',
        'PostgreSQL package manager',
        resp.contents ->> 'sql'
    )
from http(
    (
        'GET',
        'https://api.database.dev/rest/v1/'
        || 'package_versions?select=sql,version'
        || '&package_name=eq.supabase-dbdev'
        || '&order=version.desc'
        || '&limit=1',
        array[
            ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::http_header
        ],
        null,
        null
    )
) x,
lateral (
    select
        ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);
create extension "supabase-dbdev";

-- Drop and recreate the extension to ensure a clean installation
drop extension if exists "supabase-dbdev";
create extension "supabase-dbdev";
```

----------------------------------------

TITLE: Install Poetry Package Manager
DESCRIPTION: Installs the Poetry package and dependency manager for Python using pip, enabling streamlined project setup and dependency management.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/image-search-openai-clip.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pip install poetry
```

----------------------------------------

TITLE: Install Drawer component via shadcn-ui CLI
DESCRIPTION: This command uses the shadcn-ui CLI to automatically add the Drawer component and its dependencies to your project. It simplifies the setup process by handling file creation and configuration.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/drawer.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add drawer
```

----------------------------------------

TITLE: Initialize and Start Supabase Local Development Environment
DESCRIPTION: Commands to initialize a Supabase project and start the local development services. These are essential steps for setting up a fresh local database environment, particularly useful for testing migrations in CI/CD pipelines.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-15-supabase-cli-v1-and-admin-api-beta.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
supabase init
supabase start
```

----------------------------------------

TITLE: Install Supabase NuGet Package via .NET CLI
DESCRIPTION: This command installs the Supabase NuGet package using the .NET command-line interface. It adds the package reference to your project file, making the Supabase client library available for use in your C# project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/csharp/installing.mdx#_snippet_0

LANGUAGE: sh
CODE:
```
dotnet add package supabase
```

----------------------------------------

TITLE: Commit Changes and Start Local Supabase Development
DESCRIPTION: Stages all local changes, commits them to Git, and then starts the local Supabase development setup. This command makes the local database and services available for development and testing.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/deployment/managing-environments.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
git add .
git commit -m "init supabase"
supabase start
```

----------------------------------------

TITLE: Initialize Angular Project and Generate Components
DESCRIPTION: This bash script demonstrates how to set up a new Angular project using the Angular CLI. It includes commands to create a new project named `trelloBoard` with routing and SCSS styling, navigate into the project directory, and then generate various Angular components and services required for the application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-24-building-a-realtime-trello-board-with-supabase-and-angular.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
ng new trelloBoard --routing --style=scss
cd ./trelloBoard

# Generate components and services
ng generate component components/login
ng generate component components/inside/workspace
ng generate component components/inside/board

ng generate service services/auth
ng generate service services/data
```

----------------------------------------

TITLE: Start Supabase Local Development Environment
DESCRIPTION: This command initializes and starts the Supabase local development environment. It automatically applies any pending database migrations found in the `supabase/migrations` directory, preparing the local database for immediate use.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/nextjs-vector-search.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
supabase start
```

----------------------------------------

TITLE: Install Dropdown Menu Dependencies Manually
DESCRIPTION: Installs the `@radix-ui/react-dropdown-menu` package, a core dependency for the dropdown menu component, using npm. This step is required for manual setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/dropdown-menu.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-dropdown-menu
```

----------------------------------------

TITLE: Initialize a new Prisma project with various package managers
DESCRIPTION: This section provides commands to create a new directory, navigate into it, and then initialize a Prisma project using npm, pnpm, yarn, or bun. It includes installing Prisma, TypeScript, and related development dependencies, followed by `tsc --init` and `prisma init` to set up the project structure.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/prisma.mdx#_snippet_1

LANGUAGE: Bash
CODE:
```
mkdir hello-prisma
cd hello-prisma
```

LANGUAGE: Bash
CODE:
```
npm init -y
npm install prisma typescript ts-node @types/node --save-dev

npx tsc --init

npx prisma init
```

LANGUAGE: Bash
CODE:
```
pnpm init -y
pnpm install prisma typescript ts-node @types/node --save-dev

pnpx tsc --init

pnpx prisma init
```

LANGUAGE: Bash
CODE:
```
yarn init -y
yarn add prisma typescript ts-node @types/node --save-dev

npx tsc --init

npx prisma init
```

LANGUAGE: Bash
CODE:
```
bun init -y
bun install prisma typescript ts-node @types/node --save-dev

bunx tsc --init

bunx prisma init
```

----------------------------------------

TITLE: Set up Supabase Edge Functions for local development
DESCRIPTION: Commands to initialize and run Supabase Edge Functions locally. This includes starting the Supabase services, creating a local environment file, and serving the functions with the Supabase CLI.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
supabase start
cp ./supabase/.env.local.example ./supabase/.env.local
supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt
```

----------------------------------------

TITLE: Define AI Application Examples Data for Documentation Page
DESCRIPTION: This JavaScript array defines the metadata for various AI application examples showcased on the documentation page. Each object includes the example's name, a brief description, and a link to its detailed guide or repository. This structure is used to dynamically render the list of examples.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
export const examples = [
  {
    name: 'Headless Vector Search',
    description: 'A toolkit to perform vector similarity search on your knowledge base embeddings.',
    href: '/guides/ai/examples/headless-vector-search',
  },
  {
    name: 'Image Search with OpenAI CLIP',
    description: 'Implement image search with the OpenAI CLIP Model and Supabase Vector.',
    href: '/guides/ai/examples/image-search-openai-clip',
  },
  {
    name: 'Hugging Face inference',
    description: 'Generate image captions using Hugging Face.',
    href: '/guides/ai/examples/huggingface-image-captioning',
  },
  {
    name: 'OpenAI completions',
    description: 'Generate GPT text completions using OpenAI in Edge Functions.',
    href: '/guides/ai/examples/openai',
  },
  {
    name: 'Building ChatGPT Plugins',
    description: 'Use Supabase as a Retrieval Store for your ChatGPT plugin.',
    href: '/guides/ai/examples/building-chatgpt-plugins',
  },
  {
    name: 'Vector search with Next.js and OpenAI',
    description:
      'Learn how to build a ChatGPT-style doc search powered by Next.js, OpenAI, and Supabase.',
    href: '/guides/ai/examples/nextjs-vector-search',
  },
]
```

----------------------------------------

TITLE: Install Aspect Ratio Component using Shadcn UI CLI
DESCRIPTION: This command installs the Aspect Ratio component into your project using the Shadcn UI command-line interface. It automates the setup process by adding the necessary files and configurations.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/aspect-ratio.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add aspect-ratio
```

----------------------------------------

TITLE: Create Next.js App with Supabase Starter Template
DESCRIPTION: This command initializes a new Next.js project using the official Supabase starter template. It provides a pre-configured setup for integrating Supabase with Next.js, streamlining the initial project setup.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/auth/nextjs/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npx create-next-app -e with-supabase
```

----------------------------------------

TITLE: Supabase Docs Local Development Setup Commands
DESCRIPTION: This snippet outlines the essential commands and configuration required to set up and run the Supabase documentation site locally. It includes instructions for pulling internal environment variables for Supabase staff, setting a public flag for community members via a .env file, and starting the Next.js development server.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/DEVELOPERS.md#_snippet_0

LANGUAGE: Shell
CODE:
```
# For Supabase staff:
dev:secrets:pull

# For community members, create a .env file with:
NEXT_PUBLIC_IS_PLATFORM=false

# Navigate to the docs application directory:
cd /apps/docs

# Start the local development server:
npm run dev
```

----------------------------------------

TITLE: Start Local Supabase Stack
DESCRIPTION: Execute this command to start all local Supabase services, including the database, storage, and functions runtime, making them accessible for local development and testing.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/elevenlabs-text-to-speech/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
supabase start
```

----------------------------------------

TITLE: Create Supabase Project via Management API (Bash)
DESCRIPTION: This snippet uses `curl` to interact with the Supabase Management API. It first shows how to list organizations to get an ID, then how to create a new project. An access token and organization ID are required inputs.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/quickstart_db_setup.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
export SUPABASE_ACCESS_TOKEN="your-access-token"

curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/organizations

curl -X POST https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "<org-id>",
    "name": "My Project",
    "region": "us-east-1",
    "db_pass": "<your-secure-password>"
  }'
```

----------------------------------------

TITLE: Start Supabase Docker Compose with Postgres Backend
DESCRIPTION: This command sequence demonstrates how to clone the `supabase/supabase` repository, navigate into its `docker` directory, and start the Supabase services using `docker compose`. By default, this setup utilizes the Postgres backend for analytics.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/self-hosting-analytics/introduction.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
# clone the supabase/supabase repo, and run the following
cd docker
docker compose -f docker-compose.yml up
```

----------------------------------------

TITLE: Configure Ktor Client Engines for Kotlin Multiplatform
DESCRIPTION: This example illustrates how to set up Ktor HTTP client engine dependencies within a Kotlin Multiplatform project's `build.gradle.kts` file. It shows how to declare platform-specific engine implementations (e.g., `ktor-client-cio` for JVM, `ktor-client-js` for JS, `ktor-client-darwin` for iOS) within their respective source sets, ensuring the correct engine is used for each target.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/installing.mdx#_snippet_2

LANGUAGE: kotlin
CODE:
```
commonMain {
    dependencies {
        //Supabase modules
    }
}
jvmMain {
    dependencies {
        implementation("io.ktor:ktor-client-cio:KTOR_VERSION")
    }
}
androidMain {
    dependsOn(jvmMain.get())
}
jsMain {
    dependencies {
        implementation("io.ktor:ktor-client-js:KTOR_VERSION")
    }
}
iosMain {
    dependencies {
        implementation("io.ktor:ktor-client-darwin:KTOR_VERSION")
    }
}
```

----------------------------------------

TITLE: Supabase CLI Project Setup and Deployment
DESCRIPTION: This snippet provides a sequence of bash commands to set up a Supabase project from the command line, including cloning the repository, linking to a Supabase project, pushing database migrations, and deploying Edge Functions. It streamlines the local development and deployment workflow for Supabase applications.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2025-06-25-natural-db.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
git clone https://github.com/supabase-community/natural-db.git
cd natural-db
```

LANGUAGE: bash
CODE:
```
supabase login
supabase link --project-ref <YOUR-PROJECT-ID>
```

LANGUAGE: bash
CODE:
```
supabase db push
```

LANGUAGE: bash
CODE:
```
supabase functions deploy --no-verify-jwt
```

----------------------------------------

TITLE: Install Shadcn UI Table Component via CLI
DESCRIPTION: This command installs the Shadcn UI Table component using the `npx shadcn-ui` CLI tool. It adds the necessary files and dependencies to your project, simplifying the setup process for the table component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/table.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add table
```

----------------------------------------

TITLE: Connect Supabase CLI to Your Project
DESCRIPTION: Learn to authenticate the Supabase CLI and link your local development environment to a remote Supabase project. This involves logging in, listing projects to find your project ID, and then using the `supabase link` command.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
supabase login
```

LANGUAGE: bash
CODE:
```
supabase projects list
```

LANGUAGE: bash
CODE:
```
supabase link --project-ref [YOUR_PROJECT_ID]
```

----------------------------------------

TITLE: Launch a new Supabase project using the CLI bootstrap command
DESCRIPTION: The `supabase bootstrap` command provides the fastest way to spin up a new hosted Supabase project from existing starter templates. It helps users launch a new application and attach a remote database to get started quickly.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-04-19-ga-week-summary.mdx#_snippet_0

LANGUAGE: CLI
CODE:
```
supabase bootstrap
```

----------------------------------------

TITLE: Install Input OTP component via shadcn-ui CLI
DESCRIPTION: This command uses the shadcn-ui CLI to automatically add the Input OTP component and its dependencies to your project, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/input-otp.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add input-otp
```

----------------------------------------

TITLE: Install Supabase Authentication for RedwoodJS
DESCRIPTION: Integrate Supabase authentication into your RedwoodJS application using the `redwood setup auth supabase` command. This command installs the `supabase-js` library, configures the authentication client, and provides hooks for Supabase authentication within your app.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
yarn redwood setup auth supabase
```

----------------------------------------

TITLE: Run Svelte Development Server
DESCRIPTION: Command to start the Svelte development server, making the application accessible in a web browser.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-svelte.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Start local Supabase stack
DESCRIPTION: Starts the local Supabase services, including the database, authentication, and storage. It will output local environment details like the DB URL.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/mixpeek-video-search.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
supabase start
```

----------------------------------------

TITLE: Set up React app and install Supabase JS client
DESCRIPTION: Creates a new React application using `create-react-app`. It then navigates into the project directory and installs the `@supabase/supabase-js` library, which is essential for interacting with Supabase services from your React app.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2021-03-31-supabase-cli.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
# create a fresh React app
npx create-react-app react-demo --use-npm

# move into the new folder
cd react-demo

# Save the install supabase-js library
npm install --save @supabase/supabase-js
```

----------------------------------------

TITLE: Shadcn UI Form Component: Installation
DESCRIPTION: Provides commands for installing the Shadcn UI form component. This includes a CLI command for quick setup and a manual command to install the necessary npm dependencies for `react-hook-form`, `zod`, and Radix UI components.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/form.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add form
```

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-label @radix-ui/react-slot react-hook-form @hookform/resolvers zod
```

----------------------------------------

TITLE: Initialize Supabase project
DESCRIPTION: Initializes a new Supabase project in the current directory, creating a `supabase` folder for configuration. This folder is safe to commit to version control.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development/cli/getting-started.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
supabase init
```

----------------------------------------

TITLE: Install Calendar Component Dependencies Manually
DESCRIPTION: Installs the necessary `react-day-picker` and `date-fns` dependencies required for manual setup of the Calendar component. These libraries provide the core date picking functionality.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/calendar.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install react-day-picker date-fns
```

----------------------------------------

TITLE: Install Command Component via Shadcn UI CLI
DESCRIPTION: Installs the Command component using the Shadcn UI command-line interface. This is the recommended method for integrating the component into a Shadcn UI project, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/command.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add command
```

----------------------------------------

TITLE: Start RedwoodJS Development Server
DESCRIPTION: Run the `yarn rw dev` command to start the RedwoodJS development server. This command compiles your application and serves it locally, allowing you to preview your changes and test the integration.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
yarn rw dev
```

----------------------------------------

TITLE: Get or create a vector collection
DESCRIPTION: Retrieves an existing vector collection by its specified name or creates a new one if it doesn't exist. When creating, you must specify the name of the collection and the dimension of the vectors that will be stored within it.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb#_snippet_2

LANGUAGE: Python
CODE:
```
docs = vx.get_or_create_collection(name="docs", dimension=3)
```

----------------------------------------

TITLE: Supabase CLI Setup for Natural DB Project
DESCRIPTION: This snippet provides a sequence of bash commands to initialize and configure a Supabase project from the command line. It covers cloning the repository, logging into the Supabase CLI, linking to an existing project, pushing the database schema, and deploying Edge Functions.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2025-06-25-natural-db.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
git clone https://github.com/supabase-community/natural-db.git
cd natural-db
```

LANGUAGE: bash
CODE:
```
supabase login
supabase link --project-ref <YOUR-PROJECT-ID>
```

LANGUAGE: bash
CODE:
```
supabase db push
```

LANGUAGE: bash
CODE:
```
supabase functions deploy --no-verify-jwt
```

----------------------------------------

TITLE: Configure Supabase Environment Variables
DESCRIPTION: This command copies the example environment file to the local environment file, which is necessary for configuring Supabase functions with local settings and secrets.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/stripe-webhooks/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
cp supabase/.env.local.example supabase/.env.local
```

----------------------------------------

TITLE: Implement Windows Deep Linking Logic in C++
DESCRIPTION: This section provides C++ code snippets for setting up deep linking on Windows. It includes declaring a method in `win32_window.h`, adding necessary includes, implementing the `SendAppLinkToInstance` function to handle incoming deep links and manage window instances, and integrating the call into the `CreateAndShow` method for initial application launch.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/native-mobile-deep-linking.mdx#_snippet_4

LANGUAGE: cpp
CODE:
```
// Dispatches link if any.
// This method enables our app to be with a single instance too.
// This is optional but mandatory if you want to catch further links in same app.
bool SendAppLinkToInstance(const std::wstring& title);
```

LANGUAGE: cpp
CODE:
```
#include "app_links_windows/app_links_windows_plugin.h"
```

LANGUAGE: cpp
CODE:
```
bool Win32Window::SendAppLinkToInstance(const std::wstring& title) {
  // Find our exact window
  HWND hwnd = ::FindWindow(kWindowClassName, title.c_str());

  if (hwnd) {
    // Dispatch new link to current window
    SendAppLink(hwnd);

    // (Optional) Restore our window to front in same state
    WINDOWPLACEMENT place = { sizeof(WINDOWPLACEMENT) };
    GetWindowPlacement(hwnd, &place);
    switch(place.showCmd) {
      case SW_SHOWMAXIMIZED:
          ShowWindow(hwnd, SW_SHOWMAXIMIZED);
          break;
      case SW_SHOWMINIMIZED:
          ShowWindow(hwnd, SW_RESTORE);
          break;
      default:
          ShowWindow(hwnd, SW_NORMAL);
          break;
    }
    SetWindowPos(0, HWND_TOP, 0, 0, 0, 0, SWP_SHOWWINDOW | SWP_NOSIZE | SWP_NOMOVE);
    SetForegroundWindow(hwnd);
    // END Restore

    // Window has been found, don't create another one.
    return true;
  }

  return false;
}
```

LANGUAGE: cpp
CODE:
```
bool Win32Window::CreateAndShow(const std::wstring& title,
                                      const Point& origin,
                                      const Size& size) {
if (SendAppLinkToInstance(title)) {
    return false;
}

...
```

----------------------------------------

TITLE: Migrate Supabase Client Setup for SvelteKit Auth Helpers
DESCRIPTION: This snippet details the migration process for setting up the Supabase client when upgrading Supabase Auth Helpers in SvelteKit from versions 0.6.11 and below to 0.7.0. It highlights the transition from `createSupabaseClient` to `createClient` and the introduction of `setupSupabaseHelpers` for proper client initialization.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-helpers/sveltekit.mdx#_snippet_29

LANGUAGE: JavaScript
CODE:
```
import { createSupabaseClient } from '@supabase/auth-helpers-sveltekit';

const { supabaseClient } = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
);

export { supabaseClient };
```

LANGUAGE: JavaScript
CODE:
```
import { createClient } from '@supabase/supabase-js'
import { setupSupabaseHelpers } from '@supabase/auth-helpers-sveltekit'
import { dev } from '$app/environment'
import { env } from '$env/dynamic/public'
// or use the static env

// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

export const supabaseClient = createClient(
  env.PUBLIC_SUPABASE_URL,
  env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    persistSession: false,
    autoRefreshToken: false,
  }
)

setupSupabaseHelpers({
  supabaseClient,
  cookieOptions: {
    secure: !dev,
  },
})
```

----------------------------------------

TITLE: Launch RedwoodJS Development Server
DESCRIPTION: This command starts the RedwoodJS development server, compiling the application and making it accessible in a web browser. The application will typically be available at `http://localhost:8910`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_13

LANGUAGE: bash
CODE:
```
yarn rw dev
```

----------------------------------------

TITLE: Start refine development server
DESCRIPTION: This command starts the development server for the refine application, making it accessible in a web browser, typically at `http://localhost:5173`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/quickstarts/refine.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Initialize Svelte App and Install Supabase Dependencies
DESCRIPTION: Commands to create a new Svelte TypeScript project using Vite, navigate into the directory, install npm dependencies, and then install the `supabase-js` library.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-svelte.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm create vite@latest supabase-svelte -- --template svelte-ts
cd supabase-svelte
npm install
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Initialize Supabase Project Locally
DESCRIPTION: Use this command to create a new Supabase project directory and initialize the necessary configuration files for local development.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/elevenlabs-text-to-speech/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
supabase init
```

----------------------------------------

TITLE: Minimal index_advisor usage example
DESCRIPTION: A complete example demonstrating how to enable the extension, create a sample `book` table, and use `index_advisor` to get an index recommendation for a simple query on an unindexed column. The output shows the cost reduction and the suggested index.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/extensions/index_advisor.mdx#_snippet_3

LANGUAGE: SQL
CODE:
```
create extension if not exists index_advisor cascade;

create table book(
  id int primary key,
  title text not null
);

select
  *
from
  index_advisor('select book.id from book where title = $1');
```

----------------------------------------

TITLE: Start Refine.dev Development Server with npm
DESCRIPTION: This `npm` command initiates the local development server for the Refine.dev application. It allows developers to preview and interact with the application in a web browser, typically at `localhost:5173`, after setting up routes and components.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-refine.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Supabase and Expo Project Setup and Deployment Commands
DESCRIPTION: This snippet provides a sequence of shell commands necessary to set up a Supabase project, link it to a local environment, manage database schema, install Expo dependencies, initialize an Expo project, configure environment variables for security, and deploy Supabase Edge Functions.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/examples/push-notifications.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
supabase link --project-ref your-supabase-project-ref
supabase start
supabase db push
npm i
npm install --global eas-cli && eas init --id your-expo-project-id
npx expo start --dev-client
cp .env.local.example .env.local
supabase functions deploy push
supabase secrets set --env-file .env.local
```

----------------------------------------

TITLE: Open Deployed Fly.io Application in Browser
DESCRIPTION: After a successful deployment, this command allows you to quickly access your running application. It opens the URL of your deployed Fly.io application in your default web browser.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_8

LANGUAGE: bash
CODE:
```
fly apps open
```

----------------------------------------

TITLE: Start local Supabase services and React development server
DESCRIPTION: Executes `supabase start` to launch all local Supabase services, including the database, authentication, and storage. Concurrently, `npm start` launches the React development server, making both the frontend and backend accessible for local development and testing.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2021-03-31-supabase-cli.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
supabase start  # Start Supabase
npm start       # Start the React app
```

----------------------------------------

TITLE: Launch React Test Runner with npm
DESCRIPTION: Initiates the test runner in an interactive watch mode, allowing developers to continuously monitor and run tests as code changes. For more comprehensive information on testing, refer to the official Create React App documentation.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_1

LANGUAGE: shell
CODE:
```
npm test
```

----------------------------------------

TITLE: Install Supabase C# Package via NuGet
DESCRIPTION: Installs the Supabase C# client library into your .NET project using the `dotnet add package` command. This command adds the `supabase-csharp` package from NuGet to your project's dependencies.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/csharp/v0/installing.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
dotnet add package supabase-csharp
```

----------------------------------------

TITLE: Install Checkbox component using Shadcn UI CLI
DESCRIPTION: This command adds the Checkbox component and its dependencies to your project using the Shadcn UI command-line interface, streamlining the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/checkbox.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add checkbox
```

----------------------------------------

TITLE: Render Quickstart Navigation Panels (JSX)
DESCRIPTION: This JSX code snippet demonstrates how to dynamically render navigation panels for ORM and GUI quickstarts. It iterates over data items to create clickable links using Supabase's `NavData`, `Link`, and `GlassPanel` components, styling them for display.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/connecting-to-postgres.mdx#_snippet_0

LANGUAGE: JSX
CODE:
```
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6   not-prose">
  <NavData data="ormQuickstarts">
    {(data) =>
      data.items?.map((quickstart) => (
        <Link key={quickstart.url} href={quickstart.url} passHref>
          <GlassPanel
            key={quickstart.name}
            title={quickstart.name}
            className="[&>div]:p-2 flex justify-center [&_p]:text-foreground-light"
          />
        </Link>
      ))
    }
  </NavData>
  <NavData data="guiQuickstarts">
    {(data) =>
      data.items?.map((quickstart) => (
        <Link key={quickstart.url} href={quickstart.url} passHref>
          <GlassPanel
            key={quickstart.name}
            title={quickstart.name}
            className="[&>div]:p-2 flex justify-center [&_p]:text-foreground-light"
          />
        </Link>
      ))
    }
  </NavData>
</div>
```

----------------------------------------

TITLE: Open Deployed Application in Browser
DESCRIPTION: Opens the successfully deployed application in your default web browser. This command is typically used after a successful deployment to quickly access and verify the running application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_9

LANGUAGE: bash
CODE:
```
fly apps open
```

----------------------------------------

TITLE: Illustrating SQL Statement Parsing and CST Construction
DESCRIPTION: This series of code examples demonstrates the step-by-step process of an SQL parser building a Concrete Syntax Tree (CST) for the SQL statement `select '1' from contact`. Each example shows the state of remaining tokens, the evolving parse tree, and the progressively built CST as the parser consumes tokens and traverses the tree.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-12-08-postgres-language-server-implementing-parser.mdx#_snippet_14

LANGUAGE: markdown
CODE:
```
Remaining Tokens: ["select", "'1'", "from", "contact"]

Parse Tree:

  SelectStmt (0, [Select, From])
         /         \
1 (ResTarget, [])    2 (RangeVar, ['contact'])
        |             
 3 (AConst, ['1'])
```

LANGUAGE: markdown
CODE:
```
Remaining Tokens: ["from", "contact"]

Parse Tree:

  SelectStmt (0, [From])
         /         \
1 (ResTarget, [])    2 (RangeVar, ['contact'])
        |             
 3 (AConst, []) 

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
```

LANGUAGE: markdown
CODE:
```
Remaining Tokens: ["from", "contact"]

Parse Tree:

  SelectStmt (0, [From])
                   \
                     2 (RangeVar, ['contact'])

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
```

LANGUAGE: markdown
CODE:
```
Remaining Tokens: ["contact"]

Parse Tree:

  SelectStmt (0, [])
                   \
                     2 (RangeVar, ['contact'])

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
    Whitespace@10..11 " "
    From@11..15 "from"
```

LANGUAGE: markdown
CODE:
```
SelectStmt@0..23
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
    Whitespace@10..11 " "
    From@11..15 "from"
    Whitespace@15..16 " "
    RangeVar@16..23
      Ident@16..23 "contact"
```