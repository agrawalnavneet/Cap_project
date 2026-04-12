using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SupplyChain.Identity.Domain.Entities;
using SupplyChain.Identity.Domain.Enums;
using SupplyChain.Identity.Infrastructure.Services;

namespace SupplyChain.Identity.Infrastructure.Persistence.Seed;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IdentityDbContext context, IConfiguration configuration)
    {
        await SeedSuperAdminAsync(context, configuration);
        await SeedDeliveryAgentsAsync(context);
    }

    // ─── Super Admin ───────────────────────────────────────────────────────────
    private static async Task SeedSuperAdminAsync(IdentityDbContext context, IConfiguration configuration)
    {
        var email    = (configuration["SuperAdmin:Email"]    ?? "admin@cocacola-b2b.com").Trim().ToLowerInvariant();
        var password = configuration["SuperAdmin:Password"]  ?? "CocaCola@Admin2026!";
        var fullName = configuration["SuperAdmin:FullName"]  ?? "CocaCola B2B Admin";

        if (await context.Users.AnyAsync(u => u.Email == email))
            return;

        var hasher       = new PasswordHasherService();
        var passwordHash = hasher.Hash(password);
        var superAdmin   = User.CreateStaff(email, passwordHash, fullName, UserRole.SuperAdmin);

        await context.Users.AddAsync(superAdmin);
        await context.SaveChangesAsync();
    }

    // ─── Delivery Agents ───────────────────────────────────────────────────────
    // Mirrors the agent list in LogisticsSeeder so each seeded agent has a matching
    // Identity user they can log in with (password: Agent@123).
    private static async Task SeedDeliveryAgentsAsync(IdentityDbContext context)
    {
        const string agentPassword = "Agent@123";

        // Format: (email, fullName, phone)
        var agentData = new (string Email, string FullName, string Phone)[]
        {
            // Bihar
            ("rajesh.kumar.br@cocacola-b2b.com",      "Rajesh Kumar",      "9123456701"),
            ("amit.singh.br@cocacola-b2b.com",         "Amit Singh",        "9123456702"),
            ("pankaj.yadav.br@cocacola-b2b.com",       "Pankaj Yadav",      "9123456703"),
            ("sunil.gupta.br@cocacola-b2b.com",        "Sunil Gupta",       "9123456704"),
            // Maharashtra
            ("suresh.patil.mh@cocacola-b2b.com",       "Suresh Patil",      "9134567801"),
            ("ganesh.shinde.mh@cocacola-b2b.com",      "Ganesh Shinde",     "9134567802"),
            ("rohan.deshmukh.mh@cocacola-b2b.com",     "Rohan Deshmukh",    "9134567803"),
            ("ajay.pawar.mh@cocacola-b2b.com",         "Ajay Pawar",        "9134567804"),
            // Karnataka
            ("ravi.kumar.ka@cocacola-b2b.com",         "Ravi Kumar",        "9145678901"),
            ("manjunath.gowda.ka@cocacola-b2b.com",    "Manjunath Gowda",   "9145678902"),
            ("prakash.shetty.ka@cocacola-b2b.com",     "Prakash Shetty",    "9145678903"),
            ("harish.naik.ka@cocacola-b2b.com",        "Harish Naik",       "9145678904"),
            // Tamil Nadu
            ("karthik.reddy.tn@cocacola-b2b.com",      "Karthik Reddy",     "9156789001"),
            ("arjun.kumar.tn@cocacola-b2b.com",        "Arjun Kumar",       "9156789002"),
            ("vignesh.babu.tn@cocacola-b2b.com",       "Vignesh Babu",      "9156789003"),
            // Uttar Pradesh
            ("deepak.sharma.up@cocacola-b2b.com",      "Deepak Sharma",     "9167890101"),
            ("mohit.verma.up@cocacola-b2b.com",        "Mohit Verma",       "9167890102"),
            ("ankit.tiwari.up@cocacola-b2b.com",       "Ankit Tiwari",      "9167890103"),
            // Gujarat
            ("hardik.patel.gj@cocacola-b2b.com",       "Hardik Patel",      "9178901201"),
            ("jignesh.shah.gj@cocacola-b2b.com",       "Jignesh Shah",      "9178901202"),
            ("kunal.mehta.gj@cocacola-b2b.com",        "Kunal Mehta",       "9178901203"),
            // West Bengal
            ("subhajit.roy.wb@cocacola-b2b.com",       "Subhajit Roy",      "9189012301"),
            ("arindam.das.wb@cocacola-b2b.com",        "Arindam Das",       "9189012302"),
            ("suman.chatterjee.wb@cocacola-b2b.com",   "Suman Chatterjee",  "9189012303"),
            // Rajasthan
            ("mahendra.singh.rj@cocacola-b2b.com",     "Mahendra Singh",    "9190123401"),
            ("dinesh.kumar.rj@cocacola-b2b.com",       "Dinesh Kumar",      "9190123402"),
            ("lokesh.meena.rj@cocacola-b2b.com",       "Lokesh Meena",      "9190123403"),
            // Delhi
            ("arun.sharma.dl@cocacola-b2b.com",        "Arun Sharma",       "9810200001"),
            ("pradeep.gupta.dl@cocacola-b2b.com",      "Pradeep Gupta",     "9810200002"),
            ("manish.verma.dl@cocacola-b2b.com",       "Manish Verma",      "9810200003"),
            // Telangana
            ("ravi.teja.ts@cocacola-b2b.com",          "Ravi Teja",         "9848800001"),
            ("srinivas.rao.ts@cocacola-b2b.com",       "Srinivas Rao",      "9848800002"),
            ("venkat.reddy.ts@cocacola-b2b.com",       "Venkat Reddy",      "9848800003"),
            // Kerala
            ("vishnu.nair.kl@cocacola-b2b.com",        "Vishnu Nair",       "9847000001"),
            ("anil.menon.kl@cocacola-b2b.com",         "Anil Menon",        "9847000002"),
            ("manoj.pillai.kl@cocacola-b2b.com",       "Manoj Pillai",      "9847000003"),
            // Punjab
            ("harpreet.singh.pb@cocacola-b2b.com",     "Harpreet Singh",    "9815100001"),
            ("gurdeep.kaur.pb@cocacola-b2b.com",       "Gurdeep Kaur",      "9815100002"),
            ("jaspreet.sidhu.pb@cocacola-b2b.com",     "Jaspreet Sidhu",    "9815100003"),
            // Madhya Pradesh
            ("ajay.tiwari.mp@cocacola-b2b.com",        "Ajay Tiwari",       "9826200001"),
            ("rahul.jain.mp@cocacola-b2b.com",         "Rahul Jain",        "9826200002"),
            ("sandeep.yadav.mp@cocacola-b2b.com",      "Sandeep Yadav",     "9826200003"),
            // Andhra Pradesh
            ("suresh.naidu.ap@cocacola-b2b.com",       "Suresh Naidu",      "9866300001"),
            ("krishna.babu.ap@cocacola-b2b.com",       "Krishna Babu",      "9866300002"),
            ("ramesh.raju.ap@cocacola-b2b.com",        "Ramesh Raju",       "9866300003"),
            // Odisha
            ("biswajit.sahoo.od@cocacola-b2b.com",     "Biswajit Sahoo",    "9861400001"),
            ("prasanta.mohanty.od@cocacola-b2b.com",   "Prasanta Mohanty",  "9861400002"),
            ("nirmal.patra.od@cocacola-b2b.com",       "Nirmal Patra",      "9861400003"),
            // Haryana
            ("vikas.yadav.hr@cocacola-b2b.com",        "Vikas Yadav",       "9812500001"),
            ("sanjeev.kumar.hr@cocacola-b2b.com",      "Sanjeev Kumar",     "9812500002"),
            ("rohit.malik.hr@cocacola-b2b.com",        "Rohit Malik",       "9812500003"),
            // Jharkhand
            ("rajan.mahto.jh@cocacola-b2b.com",        "Rajan Mahto",       "9835600001"),
            ("suresh.munda.jh@cocacola-b2b.com",       "Suresh Munda",      "9835600002"),
            // Chhattisgarh
            ("ramkumar.sahu.cg@cocacola-b2b.com",      "Ramkumar Sahu",     "9826700001"),
            ("dinesh.yadav.cg@cocacola-b2b.com",       "Dinesh Yadav",      "9826700002"),
            // Assam
            ("dipak.borah.as@cocacola-b2b.com",        "Dipak Borah",       "9435800001"),
            ("bhupen.das.as@cocacola-b2b.com",         "Bhupen Das",        "9435800002"),
            // Uttarakhand
            ("vipin.rawat.uk@cocacola-b2b.com",        "Vipin Rawat",       "9456900001"),
            ("mohan.bisht.uk@cocacola-b2b.com",        "Mohan Bisht",       "9456900002"),
            // Himachal Pradesh
            ("suresh.thakur.hp@cocacola-b2b.com",      "Suresh Thakur",     "9418000001"),
            ("ramesh.sharma.hp@cocacola-b2b.com",      "Ramesh Sharma",     "9418000002"),
            // Goa
            ("mario.fernandes.ga@cocacola-b2b.com",    "Mario Fernandes",   "9823100001"),
            ("anthony.dsouza.ga@cocacola-b2b.com",     "Anthony D'Souza",   "9823100002"),
        };

        var hasher       = new PasswordHasherService();
        var passwordHash = hasher.Hash(agentPassword);

        // Collect existing agent emails to avoid duplicates on re-seed
        var existingEmails = await context.Users
            .Where(u => u.Role == UserRole.DeliveryAgent)
            .Select(u => u.Email)
            .ToHashSetAsync();

        var toAdd = new List<User>();
        foreach (var (email, fullName, phone) in agentData)
        {
            var normalised = email.Trim().ToLowerInvariant();
            if (existingEmails.Contains(normalised))
                continue;

            var user = User.CreateStaff(normalised, passwordHash, fullName, UserRole.DeliveryAgent);
            toAdd.Add(user);
        }

        if (toAdd.Count > 0)
        {
            await context.Users.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }
}
