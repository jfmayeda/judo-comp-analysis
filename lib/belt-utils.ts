import { JudoBelt } from './types';

export function formatBeltName(belt: JudoBelt): string {
  if (belt === 'unset') return 'Not set';
  
  // Dan grades
  const danNames: Record<string, string> = {
    shodan: '1st Dan (Shodan)',
    nidan: '2nd Dan (Nidan)',
    sandan: '3rd Dan (Sandan)',
    yondan: '4th Dan (Yondan)',
    godan: '5th Dan (Godan)',
    rokudan: '6th Dan (Rokudan)',
    shichidan: '7th Dan (Shichidan)',
    hachidan: '8th Dan (Hachidan)',
    kudan: '9th Dan (Kudan)',
    judan: '10th Dan (Judan)',
  };
  
  if (danNames[belt]) {
    return danNames[belt];
  }
  
  // Kyu grades - capitalize first letter
  return belt.charAt(0).toUpperCase() + belt.slice(1);
}

export function getBeltOptions(): Array<{ value: JudoBelt; label: string }> {
  return [
    { value: 'unset', label: 'Not set' },
    { value: 'white', label: 'White' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'orange', label: 'Orange' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'brown', label: 'Brown' },
    { value: 'shodan', label: '1st Dan (Shodan)' },
    { value: 'nidan', label: '2nd Dan (Nidan)' },
    { value: 'sandan', label: '3rd Dan (Sandan)' },
    { value: 'yondan', label: '4th Dan (Yondan)' },
    { value: 'godan', label: '5th Dan (Godan)' },
    { value: 'rokudan', label: '6th Dan (Rokudan)' },
    { value: 'shichidan', label: '7th Dan (Shichidan)' },
    { value: 'hachidan', label: '8th Dan (Hachidan)' },
    { value: 'kudan', label: '9th Dan (Kudan)' },
    { value: 'judan', label: '10th Dan (Judan)' },
  ];
}
