import Link from"next/link";import{matSvg}from"@/lib/measure/mat";import{PrintButton}from"@/components/PrintButton";export const metadata={title:"Calibration mat \xB7 Jewel Lister"};export default function MatPage(){return<main className="mx-auto max-w-3xl px-4 py-6">
      <div className="no-print mb-6 space-y-3">
        <Link href="/studio"className="text-sm text-ink/60">← Back to studio</Link>
        <h1 className="font-display text-3xl">Calibration mat</h1>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/70">
          <li>Print on A4 or US Letter at <b>100% / “Actual size”</b> (turn off “Fit to page”).</li>
          <li>Check the 10 cm line with a ruler. If it isn&apos;t exactly 100 mm, enter what you measured in Settings → Print check.</li>
          <li>Lay it flat on a table (tape the corners). Matte paper works best — avoid glossy photo paper.</li>
          <li>Place one piece inside the four markers, shoot straight down from ~25–30 cm in soft, even light.</li>
        </ol>
        <PrintButton/>
      </div>
      <div className="flex justify-center bg-white"dangerouslySetInnerHTML={{__html:matSvg()}}/>
    </main>}
