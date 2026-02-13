# Restaurant Order and Inventory Management System

## 1. Project Overview

This project is a full-stack Order and Inventory Management System designed for physical restaurants. The primary goal is to model and implement real-world restaurant operations using strong backend architecture, object-oriented design, and clean system separation.

The system manages restaurant staff, menu configuration, order lifecycle, kitchen workflow, inventory tracking, and billing. It is built with scalability in mind so that future milestones can extend the platform to support home delivery and multi-restaurant food ordering similar to large food delivery platforms.

For Milestone-1, the application supports dine-in services only and follows a post-paid billing model.

---

## 2. Objectives

- Digitize dine-in restaurant operations end to end  
- Enforce role-based access control for staff  
- Maintain a clear and traceable order lifecycle  
- Synchronize waiters and kitchen staff through system-driven workflows  
- Track inventory usage based on orders  
- Apply software engineering best practices and system design principles  

---

## 3. Actors and Roles

### 3.1 Restaurant

A restaurant represents a single physical business unit. Each restaurant operates independently and manages its own staff, menu, inventory, and orders.

---

### 3.2 Staff Roles

#### Admin

The admin represents the restaurant owner or manager and has the highest level of access.

Responsibilities:
- Register and manage the restaurant profile  
- Create and manage staff accounts  
- Assign roles to staff members  
- Create, update, and manage menu items and prices  
- Manage inventory and stock thresholds  
- View orders, bills, and reports  
- Configure taxes and service charges  

---

#### Waiter

Waiters interact directly with customers and manage dine-in orders.

Responsibilities:
- Create orders for dine-in customers  
- Add or remove items from an order before cooking begins  
- Send orders to the kitchen  
- Track order status  
- Receive notifications when food is ready  
- Serve food to customers  
- Generate and close bills  

---

#### Cook

Cooks manage food preparation in the kitchen.

Responsibilities:
- View incoming orders  
- Accept orders for preparation  
- Update cooking status  
- Mark orders as ready  
- Notify waiters when food is prepared  

---

### 3.3 Customer (Dine-In)

Customers are physically present at the restaurant.

Capabilities:
- View the restaurant menu  
- Place orders through a waiter or a customer-facing service  
- Consume food in the restaurant  
- Pay the bill after service (post-paid model)  

---

## 4. System Modules

### 4.1 Authentication and Authorization

- Secure login for staff  
- Role-based access control  
- Restaurant-level data isolation  

---

### 4.2 Restaurant Management

- Restaurant registration  
- Restaurant profile management  
- Configuration of taxes and service charges  

---

### 4.3 Staff Management

- Staff account creation  
- Role assignment  
- Staff activation and deactivation  
- Staff-restaurant association  

---

### 4.4 Menu Management

- Menu categories and items  
- Item pricing  
- Item availability control  
- Menu updates by admin only  

---

### 4.5 Inventory Management

- Ingredient tracking  
- Stock quantity management  
- Automatic inventory deduction on order placement  
- Low-stock alerts for admins  

---

### 4.6 Table Management

- Table creation and capacity definition  
- Table status tracking (free or occupied)  
- Association of tables with active orders  

---

### 4.7 Order Management

- Order creation by waiters  
- Order modification before cooking starts  
- Clear order lifecycle management  
- Order status tracking  
- Order history  

---

### 4.8 Kitchen Workflow

- Kitchen dashboard for cooks  
- Order acceptance and preparation  
- Cooking status updates  
- Ready notifications to waiters  

---

### 4.9 Billing and Payments

- Bill generation after order completion  
- Post-paid billing model  
- Tax and service charge calculation  
- Bill closure by waiter or admin  

---

### 4.10 Notifications

- New order notifications to cooks  
- Order ready notifications to waiters  
- Inventory alerts to admins  

---

## 5. Order Lifecycle

The order follows a strict state-based lifecycle:

1. Created  
2. Sent to Kitchen  
3. Cooking  
4. Ready  
5. Served  
6. Billed  
7. Closed  

Each state transition is validated and controlled by the backend.

---

## 6. Software Engineering and Design Principles

- Object-Oriented Programming principles:
  - Encapsulation  
  - Abstraction  
  - Inheritance  
  - Polymorphism  

- Layered architecture:
  - Controllers  
  - Services  
  - Repositories  

- Clean separation of concerns  
- Appropriate use of design patterns  
- Consistent and meaningful commits  

---

## 7. Technology Direction (High Level)

- Backend-first design  
- Strong emphasis on business logic and data integrity  
- Relational database with well-defined relationships  
- Scalable and extensible system architecture  

---

## 8. Future Enhancements (Post Milestone-1)

- Home delivery support  
- Pre-paid orders  
- Multi-restaurant platform  
- Delivery agent management  
- Customer accounts and order tracking  
- Ratings and reviews  
- Advanced analytics  

---

## 9. Conclusion

This project focuses on solving real-world restaurant operational problems through a backend-heavy, well-structured, and scalable system. The design emphasizes correctness, maintainability, and extensibility, making it suitable for academic evaluation as well as real-world deployment.
