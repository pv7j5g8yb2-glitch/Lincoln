# How every client contact reaches the right case

Written 2026-11-27, when the routing layer (`lincoln/src/lib/routing.ts`) was built. Every way into Lincoln goes through
one routing step before anything is opened or filed. Status: **Tested** means a test proves it
(`lincoln/tests/routing.test.mjs`, `lincoln/tests/eval/mail-routing-check.mts`); **Built** means the code handles it but
no test covers that exact case yet; **Open** means not handled yet.

## How Lincoln decides

1. **Sure, filed there whatever the model says:** a reply in a thread that already belongs to one case; a USCIS receipt
   number already on one case; an A-Number already on one case.
2. **Likely, offered first, the model decides between that case and a new matter for the same person:** the sender's
   address, a phone number, or name with date of birth, already on exactly one case.
3. **Related, offered, never filed or merged on their own:** the same address on several cases (an employer, a shared
   family address), the client's name in the sender or subject, the same employer domain.
4. **Before any new case:** the same person (address, phone, A-Number, or name with date of birth) with the same open
   matter is added to that case. A different matter for the same person is a new case. A name alone is never enough:
   a new case is opened and flagged "Same name as another client" for a person to check.
5. Every case of the firm is searched, not the most recent 200 (the old limit, which would have opened duplicates
   for any firm past 200 cases).
6. What identifies a case is learned as work comes in: addresses that write, receipt numbers on notices and in emails,
   A-Numbers, the intake link's email, phone, name with date of birth and other names, and every file already read.
7. A case id the model invents is never used. When nothing is certain, the email waits in the Inbox as "Not sorted"
   with Lincoln's note; it is never guessed and never dropped.

## 1. New people

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| A prospective client emails the firm for the first time | New case, client address recorded | Tested |
| Someone fills the firm's website contact form (arrives as an email) | Same as an email; the address in the form is used | Built |
| A new client fills the firm's intake link (website) | New case for the admins, email, phone, name with date of birth and A-Number recorded | Built |
| A new client fills an attorney's own intake link (texted after a call) | New case for that attorney | Built |
| An attorney types "new case for Ana Lima, I-130" into Lincoln | New case, unless Ana Lima with that matter exists | Built |
| An attorney forwards a client's email to Lincoln | Treated as an instruction; the quoted client address is used to match and is learned | Built |
| Two different people with the same name | Kept apart, newer case flagged | Tested |
| A person known only by one name ("Maria") | Never matched by name | Tested |

## 2. The same person, again

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| A client emails again from the same address | Filed to their case, even if the model calls it a new case | Tested |
| The same Gmail with dots or a +tag (l.u.c.i.a+docs@gmail.com) | Recognised as the same mailbox | Tested |
| A reply in the case's thread from a new address (work, phone) | Filed to the case | Tested |
| A short "thank you" in the thread | Kept in the case, not deleted as noise | Tested |
| A client emails first, then fills the intake link the attorney sent | Added to the existing case, attorney notified | Tested (rule), Built (link) |
| Fills the intake link twice | Second time added to the same case | Built |
| A new address with the same name and date of birth | Same person | Tested |
| A new address with the same phone | Same person | Tested |
| Writes years later, case older than hundreds of others | Found | Tested |
| A case first opened as a consultation or unknown type, then the matter is clear | Treated as the same matter | Tested |
| An existing client starts a second matter (H-1B done, now a green card) | New case, linked to the same person | Tested |
| A closed (approved or denied) case, the client writes about something new | New case, the old one is not reopened | Tested |
| Uses a name with or without accents, a title, a second surname | Same person | Tested |
| Signs with a married or other name | Matched when the other name came in on the intake link with the date of birth | Built |

## 3. Other people about a client

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| A relative writes about a client by name ("Documents for Omar Haddad") | Case offered from the name in the subject | Tested |
| An employer's HR writes about several employees (H-1B, L-1) | Never filed to one employee alone; offered, the model or a person decides | Tested |
| One family address used by a husband and wife, each with a case | Address offered for both, never filed to one alone | Built |
| A translator, referee or expert sends a document | Matched by thread, name in the subject, or the model; otherwise Not sorted | Built |
| Opposing counsel or a government attorney (DHS, ICE OPLA) | Government addresses never identify a case; matched by A-Number, receipt number or name | Built |
| Another firm transferring a client's file | Matched by A-Number or name; otherwise an instruction or Not sorted | Built |

## 4. Agencies

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| A USCIS receipt, RFE, approval or denial notice | Filed by receipt number, even when the model finds no case | Tested |
| A notice with a receipt number Lincoln has not seen yet | Matched by name or A-Number; its receipt number is then remembered | Built |
| A family case with several receipt numbers | Every receipt number is remembered | Built |
| An immigration court (EOIR) notice | Matched by A-Number | Built |
| State Department or NVC mail | Matched by name, thread, or the model | Built |

## 5. Files

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| The same file sent twice (a reply, a forward, an upload) | Read once; "already in the case" in the activity | Tested |
| Files from different addresses for the same client | Matched to the person as above | Built |
| A file Lincoln cannot open (password, damaged) | Never dropped: "Could not open" on the case | Built |
| An email with only attachments and no text | Matched by sender, thread or names in file names | Built |

## 6. Inside the firm

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| A member emails Lincoln an instruction | Instruction, never a client email | Built |
| The firm's own address in To or From | Never learned as a client's | Tested |
| A request posted in Teams or Google Chat | Same routing as an instruction | Built |
| Two members' messages about the same client | Same case through the routing | Built |

## 7. Noise

| Scenario | How Lincoln handles it | Status |
|---|---|---|
| Newsletters, marketing, bulk mail | Ignored (government bulk mail is kept) | Built |
| A clear non-case email | Dropped only when the model is certain and nothing ties it to a case | Built |
| Possibly case work but unclear | Kept in the Inbox as Not sorted | Built |
| A case id the model invents | Never used; the email waits in the Inbox | Tested |

## Open (not handled yet)

* **Merging two cases.** When a flagged duplicate really is the same person, the attorney cannot yet merge the cases
  in Lincoln; they close one. A merge needs the pages, documents, drafts and history moved together.
* **One email for several family members** (spouse and children, several forms): opened as one case today, not one
  linked case per person.
* **Phone calls and WhatsApp:** not read (decided). The attorney texts their intake link after a call.
* **Out of office replies and bounces:** treated by the model as noise; no rule of their own yet.
