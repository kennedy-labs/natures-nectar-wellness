Nature’s Nectar Wellness — Full Project Context For Codex

Use this as the foundational project context and engineering direction for the entire system.
The goal is to make Codex understand:

the business
the architecture philosophy
the operational reality
the engineering standards
the product direction
the scalability mindset
the development philosophy

This is NOT a tutorial project.
This is a real-world business platform engineered with senior-level thinking.

PROJECT OVERVIEW

Business Name:
Nature’s Nectar Wellness

Business Type:
Natural wellness / herbal wellness ecommerce business.

Primary Product Types:

herbal products
wellness supplements
teas
powders
oils
natural health products

Current Business State:

owner-operated
semi-manual operations
WhatsApp-driven commerce
mobile-first customer base
local delivery logistics
countrywide delivery within Kenya
pickup available at shop

Primary Goal:
Build a modern, scalable, maintainable wellness ecommerce platform that:

supports real-world business operations
minimizes operational friction
feels natural and trustworthy
integrates deeply with WhatsApp
can scale over time without architectural collapse
IMPORTANT BUSINESS REALITY

This is NOT traditional fully-automated ecommerce.

Delivery pricing is NOT fixed.

The owner currently relies on:

Bolt
matatu
manual delivery pricing

Therefore:
delivery cost calculation is dynamic and operationally flexible.

This means:
the website should NOT assume fixed automated checkout totals.

Instead:
the platform should support a semi-manual order confirmation workflow.

CORE BUSINESS FLOW

Current operational reality:

Customer:

Browses products
Selects products
Sends order / submits request
Business calculates delivery cost manually
Customer confirms
Customer pays
Product delivered or picked up

The software must SUPPORT this workflow,
not force unrealistic automation.

CUSTOMER EXPERIENCE PHILOSOPHY

The website should feel:

natural
calm
modern
breathable
clean
trustworthy
wellness-oriented
simple
human
mobile-first

Avoid:

clutter
aggressive ecommerce aesthetics
overcomplicated UI
flashy interactions
corporate stiffness

Think:
modern wellness brand.

UX PRIORITIES

Priority order:

Trust
Simplicity
Mobile usability
Product clarity
WhatsApp accessibility
Operational realism
Fast performance
IMPORTANT PRODUCT INSIGHT

Customers buying wellness/herbal products often:

ask questions before purchasing
seek reassurance
prefer direct communication

Therefore:
WhatsApp is NOT secondary.

WhatsApp is a CORE conversion mechanism.

RECOMMENDED CUSTOMER FLOW

Preferred flow:

Browse Products
→ Add To Cart
→ Submit Order
→ Continue Conversation on WhatsApp
→ Delivery confirmed
→ Payment completed
→ Order fulfilled

Alternative product-level flow:

View Product
→ Ask About Product on WhatsApp

PAYMENT METHODS

Business currently supports:

Mpesa Buy Goods
bank transfer
cash on pickup/delivery

Payments are partially manual.

Therefore:
payment verification workflows are needed.

DELIVERY MODEL

Delivery:

countrywide in Kenya
pickup available
Nairobi CBD can be free
pricing depends on real transport cost

DO NOT build rigid automated logistics assumptions.

Build flexible workflows.

CUSTOMER ACCOUNTS

For V1:
DO NOT require customer accounts.

Reason:

lower friction
better conversion
simpler UX
easier operations

Customers should be able to:

browse
order
checkout
without authentication.

Admin authentication IS required.

INVENTORY / STOCK

Inventory matters.

Products can:

go out of stock
become unavailable

V1 inventory system can be lightweight:

stock quantity
in stock
low stock
out of stock

No warehouse complexity needed initially.

LEGAL / CONTENT CONSIDERATIONS

Products may include wellness claims.

Avoid dangerous medical language.

DO NOT use:

guaranteed cures
medically absolute claims

Prefer:

“supports wellness”
“traditionally used for”
“commonly associated with”

The platform should maintain trust and reduce legal risk.

ENGINEERING PHILOSOPHY

This project must be engineered like a professional production-grade system.

Core principles:

modular
scalable
maintainable
feature-oriented
type-safe
production-minded
operationally realistic
mobile-first
clean architecture
separation of concerns

Avoid:

spaghetti code
giant component files
mixing frontend/backend responsibilities
hardcoded business logic
random folder structures
overengineering
ARCHITECTURE STYLE

Recommended architecture:
Modular Monolith

Why:

simpler deployment
easier maintenance
faster iteration
ideal for current business size
still scalable if boundaries are clean

Do NOT use microservices.

TECH STACK

Frontend:

Next.js (App Router)
TypeScript
Tailwind CSS
shadcn/ui

Backend:

Next.js fullstack architecture
API routes / server actions

Database:

PostgreSQL

ORM:

Prisma

Validation:

Zod

Forms:

React Hook Form

Server State:

TanStack Query

Client State:

Zustand

File Uploads:

Cloudinary

Authentication:

Better Auth or NextAuth

Deployment:

Vercel
Neon or Supabase (PostgreSQL)
PROJECT STRUCTURE PHILOSOPHY

Use feature-oriented architecture.

Recommended structure:

src/
│
├── app/
├── features/
├── components/
├── server/
├── services/
├── hooks/
├── store/
├── lib/
├── types/
├── validations/
├── config/
├── styles/
└── prisma/
FEATURE-ORIENTED STRUCTURE

Business features own themselves.

Example:

features/
├── products/
├── cart/
├── checkout/
├── orders/
├── inventory/
├── payments/
└── admin/

Each feature may contain:

components
hooks
services
types
validations
utilities

Goal:
strong ownership boundaries.

BACKEND LAYERING

Use layered backend architecture:

API Layer
→ Service Layer
→ Repository Layer
→ Database

Responsibilities:

API Layer:

HTTP handling
request parsing
response formatting

Service Layer:

business logic
workflows
orchestration

Repository Layer:

database access only

Database:

business truth

Never mix responsibilities carelessly.

DATABASE DESIGN PHILOSOPHY

The database is the source of business truth.

Core entities:

Category
Product
Customer
Order
OrderItem
Payment
AdminUser

Important principles:

normalization
historical data integrity
auditability
soft deletion
clean relationships
IMPORTANT DATABASE DECISIONS

Orders should preserve historical truth.

For example:
store priceAtPurchase
inside order items.

Do NOT rely on current product prices.

Use timestamps everywhere:

createdAt
updatedAt

Use slugs for SEO-friendly URLs.

RECOMMENDED ORDER FLOW

Customer:

Adds products
Provides customer info
Provides delivery location
Submits order

System:

Creates order
Admin reviews delivery requirements
Admin confirms total
Customer pays
Admin confirms payment
Order processed
Order delivered
ORDER STATUS SYSTEM

Recommended statuses:

PENDING
REVIEWING_DELIVERY
AWAITING_PAYMENT
PAID
PROCESSING
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
ADMIN DASHBOARD PHILOSOPHY

The admin panel is operational infrastructure.

Priorities:

simplicity
speed
mobile usability
low cognitive load

Admin users are likely:

multitasking
mobile-based
non-technical

Avoid:

bloated dashboards
excessive complexity
CORE ADMIN FEATURES
product management
inventory updates
order management
payment confirmation
order status updates
DESIGN SYSTEM PHILOSOPHY

Visual identity:

organic
soft
premium wellness
modern
breathable
elegant simplicity

Recommended aesthetic:

soft greens
warm neutrals
subtle earthy tones
soft rounded corners
whitespace-heavy layouts
subtle animations

Avoid:

visual noise
harsh colors
dark heavy themes
aggressive motion
UI SYSTEM THINKING

Build reusable component systems.

Primitive components:

Button
Input
Card
Badge
Modal

Composite components:

ProductCard
Navbar
CartDrawer
OrderSummary

Feature components:

CheckoutForm
InventoryManager
AdminProductEditor
MOBILE-FIRST PHILOSOPHY

Most users are likely:

Android users
WhatsApp-heavy
moderate internet speed

Optimize for:

fast loading
responsive design
large touch targets
compressed images
simple navigation

Mobile-first is NOT optional.

SEO PHILOSOPHY

Product pages should be SEO-friendly.

Use:

clean URLs
metadata
semantic structure
searchable product descriptions
FAQ content
wellness-focused discoverability

Example:

GOOD:
/products/shilajit

BAD:
/products/928383

PERFORMANCE PHILOSOPHY

Optimize:

image loading
lazy loading
bundle size
caching
rendering strategy

Target:
fast mobile experience.

SECURITY PHILOSOPHY

Protect:

admin routes
API endpoints
file uploads
authentication
database operations

Use:

server-side validation
route protection
role checks
secure environment variables
sanitized inputs

Never trust frontend data.

DEVELOPMENT PHILOSOPHY

Do NOT:

rush into random coding
start with homepage aesthetics
build isolated pages first

Build systematically:

Foundation
Architecture
Database
Infrastructure
Product system
Orders
Payments
Admin workflows
UX refinement
Optimization
IMPLEMENTATION PRIORITY

Recommended build order:

PHASE 1:

project setup
architecture
Prisma
database
design system

PHASE 2:

authentication
validation
API architecture

PHASE 3:

categories
products
inventory
admin CRUD

PHASE 4:

cart
checkout
WhatsApp integration
orders

PHASE 5:

payment confirmation
order management
delivery workflows

PHASE 6:

SEO
optimization
testing
deployment
analytics
WHAT SUCCESS LOOKS LIKE

A successful V1 should:

feel modern and trustworthy
work beautifully on mobile
support real business operations
reduce owner stress
improve product visibility
improve customer trust
simplify order management
integrate naturally with WhatsApp
scale cleanly over time
FINAL ENGINEERING MINDSET

This project is NOT:
“just a website.”

It is:

a business platform
an operational system
a commerce workflow
a scalable digital infrastructure

The UI is only one layer.

The true product is:
the system architecture,
the operational support,
and the maintainable engineering foundation underneath it.

//

PRIMARY V1 SUCCESS METRIC
The website is considered successful if:
Plain text
A customer can discover products,
understand them,
submit an order,
continue conversation through WhatsApp,
and the business owner can manage the operation efficiently.
V1 MUST SUPPORT
Customer Side
Customers must be able to:
Plain text
Browse products
Browse categories
View product details
See stock availability
Add items to cart
Submit order details
Choose delivery method
Choose payment method
Continue on WhatsApp
Use the website comfortably on mobile
Admin Side
Admin must be able to:
Plain text
Login securely
Manage products
Manage categories
Update inventory
View orders
Update order statuses
Review payment information
Manage operational workflow
V1 MUST FEEL
Plain text
Natural
Modern
Trustworthy
Calm
Breathable
Mobile-first
Wellness-oriented
V1 MUST NOT
Plain text
Feel bloated
Require customer accounts
Depend on fixed delivery pricing
Force unrealistic automation
Contain fake enterprise complexity
Contain unfinished fake features
REQUIRED V1 SYSTEMS

1. FOUNDATION SYSTEM
Must Exist
Plain text
Next.js App Router
TypeScript
Tailwind
Prisma
PostgreSQL
Feature-oriented architecture
Environment variable validation
Reusable UI system
Completion Criteria
Plain text
Project builds successfully
No TypeScript errors
No Prisma schema errors
No broken imports
Clean folder structure
Production-ready repository


2. DATABASE SYSTEM
Required Models
Plain text
User
Session
Account
Category
Product
Customer
Order
OrderItem
Payment
Completion Criteria
Plain text
Migrations work
Relationships valid
Indexes exist
Order history preserved
Soft deletion supported


3. AUTHENTICATION SYSTEM
Required
Plain text
Admin authentication only
Protected admin routes
Session handling
Role-based access
NOT Required For V1
Plain text
Customer authentication
Social login
Multi-role complexity
Completion Criteria
Plain text
Unauthorized users cannot access admin area
Admin sessions persist correctly
Protected APIs are secure


4. PRODUCT SYSTEM
Required Features
Plain text
Create product
Update product
Deactivate product
View products
View product details
Featured products
Category assignment
Stock tracking
Slug generation
Product Data Requirements
Each product must support:
Plain text
Name
Description
Benefits
Ingredients
Usage instructions
Price
Stock quantity
Category
Image
Featured status
Active status
Completion Criteria
Plain text
Products render dynamically
Admin CRUD works
Validation exists
Out-of-stock products handled
SEO-friendly slugs work


5. CATEGORY SYSTEM
Required
Plain text
Create category
Update category
View category pages
Assign products to categories
Completion Criteria
Plain text
Category filtering works
Product-category relationships valid


6. INVENTORY SYSTEM
Required
Plain text
Track stock quantity
Detect out-of-stock products
Low-stock visibility
Prevent invalid stock states
NOT Required For V1
Plain text
Warehouse systems
Supplier systems
Inventory forecasting
Completion Criteria
Plain text
Inventory updates correctly
Products reflect availability state


7. CART SYSTEM
Required
Plain text
Add to cart
Remove from cart
Update quantity
Persist cart locally
Calculate subtotal
Completion Criteria
Plain text
Cart works reliably on refresh
Mobile cart UX works


8. CHECKOUT SYSTEM
Required Inputs
Plain text
Customer name
Phone number
Optional email
Delivery method
Delivery location
Order notes
Preferred payment method
Delivery Methods
Plain text
Pickup
Local delivery
Countrywide delivery
Payment Methods
Plain text
Mpesa Buy Goods
Bank transfer
Cash on pickup
Cash on delivery
Completion Criteria
Plain text
Orders can be submitted successfully
Validation exists
Customer flow is simple


9. WHATSAPP INTEGRATION
This is CORE infrastructure.
Required
Plain text
WhatsApp CTA buttons
WhatsApp order continuation
Product inquiry messaging
Order summary messaging
Completion Criteria
Plain text
Customer can continue conversation seamlessly through WhatsApp
Messages contain useful order information


10. ORDER SYSTEM
Required
Plain text
Create orders
Create order items
Store customer snapshot
Track statuses
Admin order management
Required Statuses
Plain text
PENDING
REVIEWING_DELIVERY
AWAITING_PAYMENT
PAID
PROCESSING
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
Completion Criteria
Plain text
Orders persist correctly
Admin can manage workflow
Historical purchase data preserved


11. PAYMENT WORKFLOW
Required
Plain text
Manual payment confirmation
Payment references
Payment status updates
NOT Required For V1
Plain text
Automated Mpesa STK push
Complex financial systems
Subscription billing
Completion Criteria
Plain text
Admin can track payment progress
Payment states are clear


12. ADMIN DASHBOARD
Required
Plain text
Product management
Category management
Order management
Inventory management
Completion Criteria
Plain text
Admin workflows are usable on mobile
Operational tasks are simple


13. UI / DESIGN SYSTEM
Required
Plain text
Reusable components
Consistent spacing
Responsive layouts
Accessible interactions
Visual Requirements
Plain text
Soft wellness aesthetic
Natural color palette
Whitespace-heavy layouts
Clean typography
Completion Criteria
Plain text
UI consistency maintained across pages
Mobile UX polished
No broken layouts


14. API ARCHITECTURE
Required
Plain text
Thin API routes
Service layer
Repository layer
Validation layer
Consistent responses
Error handling
Completion Criteria
Plain text
API responsibilities separated correctly
Validation centralized
Errors handled safely


15. SECURITY
Required
Plain text
Protected admin routes
Server-side validation
Secure environment variables
Authenticated admin APIs
Completion Criteria
Plain text
Unauthorized modification impossible through normal requests


16. SEO & PERFORMANCE
Required
Plain text
Metadata
Semantic structure
Optimized images
Fast mobile loading
SEO-friendly URLs
Completion Criteria
Plain text
Pages load quickly on mobile
Product pages indexable


17. DEPLOYMENT
Required
Plain text
Production deployment
Environment variables configured
Database connected
Build passes
Hosting Stack
Plain text
Vercel
Neon/Supabase PostgreSQL
Cloudinary
Completion Criteria
Plain text
Website accessible publicly
Admin system operational
No critical production crashes
V1 IS CONSIDERED COMPLETE WHEN
ALL of the following are true:
Plain text
Business can realistically operate through the platform
Customers can place orders successfully
Admin can manage operations successfully
Mobile UX is polished
Core workflows are stable
Architecture remains maintainable
System deploys successfully
V1 IS NOT BLOCKED BY
These are FUTURE FEATURES:
Plain text
Customer accounts
AI recommendations
Advanced analytics
Automated Mpesa
Email automation
SMS systems
Coupon systems
Wishlist
Reviews
Native mobile app
Microservices
Advanced delivery integrations
FINAL ENGINEERING RULE
An AI system should consider V1 complete when:
Plain text
The platform solves the real operational problems
of Nature’s Nectar Wellness
without architectural instability,
without fake complexity,
and without unfinished critical workflows.