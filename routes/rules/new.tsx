import RuleForm from "../../islands/RuleForm.tsx";

export default function NewRule() {
  return (
    <div class="page">
      <header class="hero">
        <h1>New Rule</h1>
        <p>Define a condition and outcome payload.</p>
      </header>
      <RuleForm />
    </div>
  );
}
