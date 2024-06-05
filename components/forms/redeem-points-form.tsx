"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  totalPoints: number;
  onSubmitForm: (values: z.infer<typeof formSchema>) => void;
  onChainPoints: number;
};

const formSchema = z.object({
  amount: z.string(),
});

const RedeemPointsForm: React.FC<Props> = ({
  totalPoints,
  onSubmitForm,
  onChainPoints,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmitForm(values);
  };

  const amount = form.watch("amount");

  console.log(amount, "amount");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input placeholder="Enter points" {...field} />
              </FormControl>
              <FormDescription className="font-light">
                <span>Total points available: {totalPoints}</span>
                <br />
                Total points on chain: {onChainPoints}
                <br />
                <span className="font-semibold">Redeemable points: {totalPoints - onChainPoints}</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={
            !amount ||
            totalPoints < Number(amount) ||
            Number(totalPoints) - onChainPoints < Number(amount)
          }
        >
          Redeem {Number(amount) > 0 ? amount : ""} points
        </Button>
      </form>
    </Form>
  );
};

export default RedeemPointsForm;
