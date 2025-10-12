# Modal & Dialog Patterns

**Last Updated:** 2025-10-12

---

## Overview

This guide explains when to use each modal/dialog component in the application.

---

## Component Types

### 1. **BaseModal** (Custom)
**Location:** `components/shared/base-modal.tsx`

**Use for:** Feature-specific modals with custom content and behavior

**Features:**
- Custom styling and animations
- Built-in confirmation, info, and success variants
- Flexible content area
- Imperative API via ref

**Examples:**
- Share modal
- Export modal
- Publish modal
- Embed modal

**Usage:**
```typescript
import { BaseModal } from '@/components/shared';

<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Share JSON"
  description="Share your JSON with others"
>
  {/* Custom content */}
</BaseModal>
```

---

### 2. **Dialog** (Radix Primitive)
**Location:** `components/ui/dialog.tsx`

**Use for:** General-purpose dialogs with standard content

**Features:**
- Radix UI primitive
- Accessible by default
- Composable API
- Standard dialog behavior

**Examples:**
- Settings dialogs
- Form dialogs
- Information displays

**Usage:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

### 3. **AlertDialog** (Radix Primitive)
**Location:** `components/ui/alert-dialog.tsx`

**Use for:** Confirmation dialogs and destructive actions

**Features:**
- Radix UI primitive
- Accessible confirmation pattern
- Cancel/Confirm actions
- Interrupts user flow

**Examples:**
- Delete confirmations
- Unsaved changes warnings
- Destructive action confirmations

**Usage:**
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 4. **Sheet** (Radix Primitive)
**Location:** `components/ui/sheet.tsx`

**Use for:** Side panels and drawers

**Features:**
- Radix UI primitive
- Slides in from edges (top, right, bottom, left)
- Good for mobile navigation
- Good for contextual information

**Examples:**
- Mobile navigation menu
- Filters panel
- Settings panel
- Details sidebar

**Usage:**
```typescript
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Sheet description</SheetDescription>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

## Decision Tree

```
Need a modal/dialog?
│
├─ Is it a confirmation/destructive action?
│  └─ YES → Use AlertDialog
│
├─ Is it a side panel/drawer?
│  └─ YES → Use Sheet
│
├─ Is it a feature-specific modal (share, export, etc.)?
│  └─ YES → Use BaseModal
│
└─ Is it a general dialog?
   └─ YES → Use Dialog
```

---

## Best Practices

### 1. **Accessibility**
- Always provide `title` and `description`
- Use semantic HTML
- Ensure keyboard navigation works
- Test with screen readers

### 2. **User Experience**
- Don't nest modals (avoid modal-in-modal)
- Provide clear close actions
- Use appropriate modal type for the context
- Consider mobile experience

### 3. **Performance**
- Lazy load heavy modals
- Use `dynamic()` for code splitting
- Avoid rendering modal content when closed

**Example:**
```typescript
import dynamic from 'next/dynamic';

const ShareModal = dynamic(
  () => import('@/components/features/modals/share-modal').then(m => ({ default: m.ShareModal })),
  { ssr: false }
);
```

### 4. **State Management**
- Use controlled state (`open` + `onOpenChange`)
- Clean up state on close
- Handle async operations properly

---

## Common Patterns

### Pattern 1: Confirmation Before Action
```typescript
const [showConfirm, setShowConfirm] = useState(false);

const handleDelete = async () => {
  setShowConfirm(true);
};

const confirmDelete = async () => {
  await deleteItem();
  setShowConfirm(false);
};

<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  {/* ... */}
</AlertDialog>
```

### Pattern 2: Multi-Step Modal
```typescript
const [step, setStep] = useState(1);

<BaseModal isOpen={isOpen} onClose={onClose}>
  {step === 1 && <Step1 onNext={() => setStep(2)} />}
  {step === 2 && <Step2 onBack={() => setStep(1)} onNext={() => setStep(3)} />}
  {step === 3 && <Step3 onBack={() => setStep(2)} onFinish={onClose} />}
</BaseModal>
```

### Pattern 3: Form in Modal
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>
      {/* Form fields */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Migration Guide

### From BaseModal to Dialog
If you have a simple modal using BaseModal, consider migrating to Dialog:

**Before:**
```typescript
<BaseModal isOpen={isOpen} onClose={onClose} title="Settings">
  <div>{/* Content */}</div>
</BaseModal>
```

**After:**
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>
    <div>{/* Content */}</div>
  </DialogContent>
</Dialog>
```

---

## Summary

| Component | Use Case | Complexity | Accessibility |
|-----------|----------|------------|---------------|
| **BaseModal** | Feature modals | High | Custom |
| **Dialog** | General dialogs | Medium | Built-in |
| **AlertDialog** | Confirmations | Low | Built-in |
| **Sheet** | Side panels | Medium | Built-in |

**Recommendation:** Use Radix primitives (Dialog, AlertDialog, Sheet) for new components unless you need custom behavior that BaseModal provides.


