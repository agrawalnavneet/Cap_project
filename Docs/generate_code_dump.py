import os
import sys
from pathlib import Path

# Configuration
WORKSPACE_DIR = "/Users/navneetagarwal/Desktop/donet/Frontend/project/Early Sprint"
BACKEND_DIR = os.path.join(WORKSPACE_DIR, "Backend/EnterpriseB2BSupplyChain")
FRONTEND_DIR = os.path.join(WORKSPACE_DIR, "Frontend/Cococola.ui")
OUTPUT_FILE = "/Users/navneetagarwal/Desktop/donet/Frontend/project/docs/CocaCola_Full_CodeBase_With_UseCases.md"

IGNORE_DIRS = {".git", ".vscode", ".angular", "node_modules", "bin", "obj", "dist", "out-tsc"}
IGNORE_EXTS = {".dll", ".exe", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdb", ".suo", ".user", ".db", ".lock"}

USE_CASES = {
    "Identity": "### Use Case & Flow: Identity Service\nManages external Dealer and SuperAdmin registrations. Employs OTP magic-links for verification. Controls RBAC (Role Based Access Control) and issues JWTs for authentication.",
    "Catalog": "### Use Case & Flow: Catalog Service\nResponsible for maintaining product SKUs and tier-based pricing structures for Coke products. Heavily relies on Redis caching to ensure fast UI rendering.",
    "Order": "### Use Case & Flow: Order Service\nCore orchestrator that manages shopping carts and state machines for orders. Transitions orders from cart initialization through payment checks, concluding in ready-to-dispatch states.",
    "Payment": "### Use Case & Flow: Payment Service\nIntegrates closely with Razorpay APIs. Listens via webhooks for successful financial transactions on checkout. Commits the transaction and updates Order via RabbitMQ.",
    "Logistics": "### Use Case & Flow: Logistics Service\nResponsible for tracking shipments, maintaining a pool of delivery agents, and updating the front-end tracking map when dispatch begins using geographic points.",
    "Notification": "### Use Case & Flow: Notification Service\nDecoupled component acting as a silent event-listener (via RabbitMQ) to transmit SMTP emails (Registration links, Order Confirmations, Dispatches).",
    "Gateway": "### Use Case & Flow: API Gateway (Ocelot)\nCentral traffic routing proxy that sits at localhost:5050 and proxies JSON requests to internal Docker service layers (e.g., identity-service:8080).",
    "SharedInfrastructure": "### Use Case & Flow: Shared Infrastructure Building Blocks\nCommon NuGet-style libraries referenced by all Microservices. Configures MassTransit schemas, generic Exception Middlewares, and Serilog logging enrichers.",
    "Cococola.ui": "### Use Case & Flow: Angular Frontend Client\nImplements the client UI showcasing product catalogues, agent tracking interfaces, admin approval consoles, and the actual dealer checkout flow using signals and NgRx/RxJS states."
}

def get_use_case(path_str):
    for key, description in USE_CASES.items():
        if key in path_str:
            return description
    return None

def get_markdown_lang(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".cs": return "csharp"
    elif ext == ".ts": return "typescript"
    elif ext == ".js": return "javascript"
    elif ext == ".html": return "html"
    elif ext == ".css": return "css"
    elif ext == ".scss": return "scss"
    elif ext == ".json": return "json"
    elif ext == ".yml" or ext == ".yaml": return "yaml"
    elif "Dockerfile" in file_path: return "dockerfile"
    else: return "text"

def walk_and_dump(base_dir, f_out):
    current_use_case_key = None
    
    for root, dirs, files in os.walk(base_dir):
        # Mutate dirs in-place to avoid parsing ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in IGNORE_EXTS:
                continue
                
            file_path = os.path.join(root, file)
            # Try to read file to ensure it's text
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                # If reading as UTF-8 fails, skip the file
                continue
                
            # See if we need to print a new Use Case header
            rel_path = os.path.relpath(file_path, WORKSPACE_DIR)
            use_case_desc = get_use_case(rel_path)
            
            f_out.write(f"\n\n---\n")
            if use_case_desc:
                f_out.write(f"{use_case_desc}\n\n")
                
            f_out.write(f"#### File: `{rel_path}`\n")
            lang = get_markdown_lang(file)
            f_out.write(f"```{lang}\n")
            f_out.write(content)
            if not content.endswith("\n"):
                f_out.write("\n")
            f_out.write("```\n")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f_out:
        f_out.write("# Coca-Cola B2B Full Source Code & Use Cases\n\n")
        f_out.write("This document contains the entire traversable codebase for the backend and frontend components, alongside business use-case explanations for every major module.\n\n")
        
        print(f"Traversing backend: {BACKEND_DIR}")
        walk_and_dump(BACKEND_DIR, f_out)
        
        print(f"Traversing frontend: {FRONTEND_DIR}")
        walk_and_dump(FRONTEND_DIR, f_out)
        
    print(f"Done! Dump written to {OUTPUT_FILE}")
