import { useParams } from 'react-router-dom'
import Collection from './Collection'

export default function Brand() {
  const { brand } = useParams()
  return <Collection brand={decodeURIComponent(brand || '')} />
}
