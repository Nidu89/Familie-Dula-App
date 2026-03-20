"use client"

import { useState } from "react"
import { Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { leaveFamilyAction } from "@/lib/actions/family"

interface LeaveFamilySectionProps {
  isLastAdmin: boolean
}

export function LeaveFamilySection({ isLastAdmin }: LeaveFamilySectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function handleLeave() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      await leaveFamilyAction()
    } catch {
      // redirect() wirft eine NEXT_REDIRECT Exception
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">Familie verlassen</CardTitle>
        <CardDescription>
          Wenn du die Familie verlaesst, verlierst du den Zugriff auf alle
          gemeinsamen Daten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}

        {isLastAdmin ? (
          <p className="text-sm text-muted-foreground">
            Du bist der letzte Admin dieser Familie. Ernenne zuerst ein anderes
            Mitglied zum Admin, bevor du die Familie verlassen kannst.
          </p>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" />
                Familie verlassen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Familie wirklich verlassen?</DialogTitle>
                <DialogDescription>
                  Du verlierst sofort den Zugriff auf alle Familiendaten. Diese
                  Aktion kann nicht rueckgaengig gemacht werden. Du kannst der
                  Familie spaeter nur per Einladung wieder beitreten.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verlassen...
                    </>
                  ) : (
                    "Ja, Familie verlassen"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
